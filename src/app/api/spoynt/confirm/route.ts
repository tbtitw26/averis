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
            scope: "spoynt.confirm",
            event,
            ts: new Date().toISOString(),
            ...payload,
        }, null, 2)
    );
}

export async function GET(req: NextRequest) {
    try {
        const payload = await requireAuth(req);
        const cpi = new URL(req.url).searchParams.get("cpi");
        paymentLog("request.received", {
            path: req.nextUrl.pathname,
            userId: payload.sub,
            cpi,
        });

        if (!cpi) return NextResponse.json({ message: "Missing cpi" }, { status: 400 });

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL");
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");

        const url = `${SPOYNT_BASE_URL}/payment-invoices/${encodeURIComponent(cpi)}`;

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

        const status = String(attrs?.status || "created");
        const resolution = attrs?.resolution ? String(attrs.resolution) : null;
        const metadata =
            attrs?.metadata && typeof attrs.metadata === "object" && !Array.isArray(attrs.metadata)
                ? attrs.metadata
                : {};
        const payment = await spoyntService.getPaymentByCpi(cpi);

        const userId = String(metadata.user_id || payment?.userId || "");
        const tokens = Number(metadata.tokens ?? payment?.tokens ?? NaN);
        const chargedCurrency = String(attrs?.currency || payment?.chargedCurrency || "");
        const chargedAmount = Number(attrs?.amount ?? payment?.chargedAmount ?? NaN);
        const requestedCurrency = String(metadata.ui_currency || payment?.requestedCurrency || chargedCurrency);
        const requestedAmount = Number(metadata.ui_amount ?? payment?.requestedAmount ?? chargedAmount);
        const referenceId = String(attrs?.reference_id || payment?.referenceId || "");
        const providerUpdatedAt = Number(attrs?.updated ?? payment?.providerUpdatedAt ?? NaN);

        if (!userId) {
            return NextResponse.json({ message: "Invoice metadata missing" }, { status: 400 });
        }

        if (userId !== payload.sub) {
            return NextResponse.json({ message: "Not your payment" }, { status: 403 });
        }

        const result = await spoyntService.processInvoice({
            cpi,
            referenceId,
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
            paymentLog("payment.invalid", { cpi, message: result.message });
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

        if (result.state === "credited") {
            paymentLog("payment.credited", {
                cpi,
                referenceId,
                tokens: result.tokens,
                balanceAfter: result.balanceAfter,
                alreadyCredited: result.alreadyCredited,
            });
            return NextResponse.json({
                status: "credited",
                tokens: result.tokens,
                balanceAfter: result.balanceAfter,
                alreadyCredited: result.alreadyCredited,
            });
        }

        paymentLog("payment.pending_or_failed", {
            cpi,
            referenceId,
            state: result.state,
            status: result.status,
            resolution: result.resolution,
        });

        return NextResponse.json({
            status: result.state,
            message: result.state === "pending" ? "Payment is still pending" : "Payment not confirmed",
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
