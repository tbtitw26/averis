import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import { spoyntService } from "@/backend/services/spoynt.service";

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function basicAuthHeader(username: string, password: string) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${token}`;
}

function paymentLog(event: string, payload: Record<string, unknown>) {
    console.info(
        JSON.stringify({
            scope: "spoynt.status",
            event,
            ts: new Date().toISOString(),
            ...payload,
        }, null, 2)
    );
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ reference: string }> }
) {
    try {
        const payload = await requireAuth(req);
        const { reference } = await params;
        paymentLog("request.received", {
            path: req.nextUrl.pathname,
            userId: payload.sub,
            reference,
        });

        if (!reference) {
            return NextResponse.json({ message: "Missing reference" }, { status: 400 });
        }

        const payment = await spoyntService.getPaymentByReference(reference);

        if (!payment) {
            return NextResponse.json({ message: "Payment not found" }, { status: 404 });
        }

        if (String(payment.userId) !== payload.sub) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        paymentLog("payment.loaded", {
            reference,
            cpi: payment.cpi,
            creditStatus: payment.creditStatus,
            storedStatus: payment.status,
            storedResolution: payment.resolution,
        });

        if (payment.creditStatus === "credited") {
            paymentLog("payment.already_credited", {
                reference,
                tokens: payment.tokens,
            });
            return NextResponse.json({
                reference,
                status: "credited",
                tokens: payment.tokens,
                balanceAfter: null,
                alreadyCredited: true,
            });
        }

        if (!payment.cpi) {
            return NextResponse.json({
                reference,
                status: "pending",
                spoynt: { status: payment.status, resolution: payment.resolution },
            });
        }

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL");
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");

        const url = `${SPOYNT_BASE_URL}/payment-invoices/${encodeURIComponent(payment.cpi)}`;
        const r = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: basicAuthHeader(SPOYNT_ACCOUNT_ID, SPOYNT_API_KEY),
            },
            cache: "no-store",
        });

        const text = await r.text();
        if (!r.ok) {
            return NextResponse.json({ message: "Spoynt fetch failed", details: text }, { status: 502 });
        }

        const json = JSON.parse(text);
        const attrs = json?.data?.attributes;
        const metadata =
            attrs?.metadata && typeof attrs.metadata === "object" && !Array.isArray(attrs.metadata)
                ? attrs.metadata
                : {};

        const result = await spoyntService.processInvoice({
            cpi: payment.cpi,
            referenceId: String(attrs?.reference_id || payment.referenceId),
            userId: String(metadata.user_id || payment.userId),
            tokens: Number(metadata.tokens ?? payment.tokens ?? NaN),
            requestedCurrency: String(metadata.ui_currency || payment.requestedCurrency || attrs?.currency || ""),
            requestedAmount: Number(metadata.ui_amount ?? payment.requestedAmount ?? attrs?.amount ?? NaN),
            chargedCurrency: String(attrs?.currency || payment.chargedCurrency || ""),
            chargedAmount: Number(attrs?.amount ?? payment.chargedAmount ?? NaN),
            status: String(attrs?.status || payment.status || "created"),
            resolution: attrs?.resolution ? String(attrs.resolution) : payment.resolution,
            providerUpdatedAt: Number.isFinite(Number(attrs?.updated))
                ? Number(attrs.updated)
                : payment.providerUpdatedAt,
        });

        if (result.state === "invalid") {
            paymentLog("payment.invalid", { reference, cpi: payment.cpi, message: result.message });
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

        if (result.state === "credited") {
            paymentLog("payment.credited", {
                reference,
                cpi: payment.cpi,
                tokens: result.tokens,
                balanceAfter: result.balanceAfter,
                alreadyCredited: result.alreadyCredited,
            });
            return NextResponse.json({
                reference,
                status: "credited",
                tokens: result.tokens,
                balanceAfter: result.balanceAfter,
                alreadyCredited: result.alreadyCredited,
            });
        }

        paymentLog("payment.pending_or_failed", {
            reference,
            cpi: payment.cpi,
            state: result.state,
            status: result.status,
            resolution: result.resolution,
        });

        return NextResponse.json({
            reference,
            status: result.state,
            spoynt: { status: result.status, resolution: result.resolution },
        });
    } catch (err: unknown) {
        paymentLog("request.failed", {
            message: err instanceof Error ? err.message : "Unknown error",
        });
        return NextResponse.json(
            { message: err instanceof Error ? err.message : "Unknown error" },
            { status: 400 }
        );
    }
}
