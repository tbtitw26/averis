// app/api/spoynt/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { spoyntService } from "@/backend/services/spoynt.service";

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

/**
 * Spoynt signature:
 * base64_encode( sha1( secret + rawJson + secret, true ) )
 * :contentReference[oaicite:9]{index=9}
 */
function spoyntSignature(secret: string, rawBody: string) {
    const sha1 = crypto.createHash("sha1");
    sha1.update(secret + rawBody + secret, "utf8");
    const digest = sha1.digest(); // binary
    return Buffer.from(digest).toString("base64");
}

function paymentLog(event: string, payload: Record<string, unknown>) {
    console.info(
        JSON.stringify({
            scope: "spoynt.webhook",
            event,
            ts: new Date().toISOString(),
            ...payload,
        }, null, 2)
    );
}

export async function POST(req: NextRequest) {
    try {
        const secret = assertEnv("SPOYNT_PRIVATE_KEY");

        // Важливо: підпис рахується по RAW JSON :contentReference[oaicite:10]{index=10}
        const rawBody = await req.text();
        const theirSig =
            req.headers.get("x-signature") ||
            req.headers.get("X-Signature") ||
            "";

        paymentLog("request.received", {
            path: req.nextUrl.pathname,
            signaturePresent: Boolean(theirSig),
            bodyLength: rawBody.length,
        });

        if (!theirSig) {
            return NextResponse.json({ message: "Missing X-Signature" }, { status: 400 });
        }

        const ourSig = spoyntSignature(secret, rawBody);

        // constant-time compare
        const a = Buffer.from(ourSig);
        const b = Buffer.from(theirSig);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);

        const type = payload?.data?.type;
        const cpi = payload?.data?.id;
        const attrs = payload?.data?.attributes;

        if (type !== "payment-invoices" || !cpi) {
            return NextResponse.json({ message: "Unsupported callback type" }, { status: 200 });
        }

        const status = String(attrs?.status || "created");
        const resolution = attrs?.resolution ? String(attrs.resolution) : null;
        const metadata =
            attrs?.metadata && typeof attrs.metadata === "object" && !Array.isArray(attrs.metadata)
                ? attrs.metadata
                : {};

        const referenceId = String(attrs?.reference_id || "");
        const payment = (await spoyntService.getPaymentByCpi(cpi)) || (referenceId
            ? await spoyntService.getPaymentByReference(referenceId)
            : null);
        const userId = String(metadata.user_id || payment?.userId || "");
        const tokens = Number(metadata.tokens ?? payment?.tokens ?? NaN);
        const chargedCurrency = String(attrs?.currency || payment?.chargedCurrency || "");
        const chargedAmount = Number(attrs?.amount ?? payment?.chargedAmount ?? NaN);
        const requestedCurrency = String(metadata.ui_currency || payment?.requestedCurrency || chargedCurrency);
        const requestedAmount = Number(metadata.ui_amount ?? payment?.requestedAmount ?? chargedAmount);
        const resolvedReferenceId = String(referenceId || payment?.referenceId || "");
        const providerUpdatedAt = Number(attrs?.updated ?? payment?.providerUpdatedAt ?? NaN);

        paymentLog("callback.parsed", {
            cpi,
            referenceId: resolvedReferenceId,
            status,
            resolution,
            chargedCurrency,
            chargedAmount,
            requestedCurrency,
            requestedAmount,
            providerUpdatedAt: Number.isFinite(providerUpdatedAt) ? providerUpdatedAt : null,
        });

        const result = await spoyntService.processInvoice({
            cpi,
            referenceId: resolvedReferenceId,
            userId,
            tokens,
            requestedCurrency,
            requestedAmount,
            chargedCurrency,
            chargedAmount,
            status,
            resolution,
            providerUpdatedAt: Number.isFinite(providerUpdatedAt) ? providerUpdatedAt : null,
        });

        if (result.state === "invalid") {
            paymentLog("callback.invalid", { cpi, message: result.message });
            return NextResponse.json({ message: result.message }, { status: 200 });
        }

        paymentLog("callback.processed", {
            cpi,
            referenceId: resolvedReferenceId,
            state: result.state,
            ...(result.state === "credited"
                ? {
                    tokens: result.tokens,
                    balanceAfter: result.balanceAfter,
                    alreadyCredited: result.alreadyCredited,
                }
                : {
                    status: result.status,
                    resolution: result.resolution,
                }),
        });

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        paymentLog("request.failed", {
            message: err instanceof Error ? err.message : "Webhook error",
        });
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Webhook error" },
            { status: 400 }
        );
    }
}
