// app/api/spoynt/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import crypto from "crypto";

const TOKENS_PER_GBP = 100;
const RATES_TO_GBP = { GBP: 1, EUR: 1.17, USD: 1.27 } as const;
const MIN_AMOUNT = 10;

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function basicAuthHeader(username: string, password: string) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${token}`;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function getServiceForCurrency(currency: keyof typeof RATES_TO_GBP, fallback: string) {
    if (currency === "GBP") return fallback;
    const envName = `SPOYNT_DEFAULT_SERVICE_${currency}`;
    const candidate = process.env[envName];
    if (!candidate) {
        throw new Error(`Missing env: ${envName}`);
    }
    return candidate;
}

export async function POST(req: NextRequest) {
    try {
        const payload = await requireAuth(req);
        const body = await req.json().catch(() => ({}));

        // Вхідні варіанти:
        // A) preset: { tokens: number }
        // B) custom: { currency: "GBP"|"EUR"|"USD", amount: number }  (сума в валюті UI)

        let currency: "GBP" | "EUR" | "USD" = "GBP";
        let amountInCurrency: number | null = null;
        let tokens: number;

        if (typeof body.tokens === "number" && body.tokens > 0) {
            tokens = Math.floor(body.tokens);
            // Пресет рахуємо як GBP
            currency = "GBP";
            amountInCurrency = round2(tokens / TOKENS_PER_GBP);
            if (amountInCurrency < MIN_AMOUNT) {
                return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
            }
        } else if (body.currency && body.amount) {
            currency = body.currency;
            if (!Object.keys(RATES_TO_GBP).includes(currency)) {
                return NextResponse.json({ message: "Unsupported currency" }, { status: 400 });
            }
            const a = Number(body.amount);
            if (!Number.isFinite(a) || a <= 0) {
                return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
            }
            amountInCurrency = round2(a);
            if (amountInCurrency < MIN_AMOUNT) {
                return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
            }

            const gbpEquivalent = amountInCurrency / RATES_TO_GBP[currency];
            tokens = Math.floor(gbpEquivalent * TOKENS_PER_GBP);
        } else {
            return NextResponse.json(
                { message: "Provide either {tokens} or {currency, amount}" },
                { status: 400 }
            );
        }

        const invoiceCurrency = currency;
        const gbpAmount =
            currency === "GBP" ? amountInCurrency! : round2(amountInCurrency! / RATES_TO_GBP[currency]);

        if (gbpAmount < 0.01) {
            return NextResponse.json({ message: "Minimum is 0.01" }, { status: 400 });
        }

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL"); // e.g. https://api.spoynt.com
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");
        const SPOYNT_DEFAULT_SERVICE = assertEnv("SPOYNT_DEFAULT_SERVICE");
        const spoyntService = getServiceForCurrency(currency, SPOYNT_DEFAULT_SERVICE);
        const SPOYNT_CALLBACK_URL = assertEnv("SPOYNT_CALLBACK_URL");

        const SPOYNT_RETURN_SUCCESS = assertEnv("SPOYNT_RETURN_SUCCESS");
        const SPOYNT_RETURN_FAIL = assertEnv("SPOYNT_RETURN_FAIL");
        const SPOYNT_RETURN_PENDING = assertEnv("SPOYNT_RETURN_PENDING");

        // reference_id = ідемпотентність на твоєму боці + зручно матчити callback
        const referenceId = crypto.randomUUID();

        // JSON API стиль видно в callback прикладі, і private API приймає JSON (curl -d '{...}') :contentReference[oaicite:3]{index=3}
        // Endpoint приклад: {BASE COM PRIVATE API URL}/payment-invoices :contentReference[oaicite:4]{index=4}
        const createUrl = `${SPOYNT_BASE_URL}/payment-invoices`;

        const invoicePayload = {
            data: {
                type: "payment-invoices",
                attributes: {
                    amount: amountInCurrency,
                    currency: invoiceCurrency,
                    service: spoyntService,
                    reference_id: referenceId,
                    description: `Averis tokens: ${tokens}`,
                    callback_url: SPOYNT_CALLBACK_URL,
                    return_urls: {
                        success: SPOYNT_RETURN_SUCCESS,
                        fail: SPOYNT_RETURN_FAIL,
                        pending: SPOYNT_RETURN_PENDING,
                    },
                    metadata: {
                        user_id: payload.sub,
                        tokens: String(tokens),
                        ui_currency: currency,
                        ui_amount: String(amountInCurrency),
                    },
                },
            },
        };

        const r = await fetch(createUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
                Authorization: basicAuthHeader(SPOYNT_ACCOUNT_ID, SPOYNT_API_KEY),
            },
            body: JSON.stringify(invoicePayload),
        });

        if (!r.ok) {
            const text = await r.text();
            return NextResponse.json({ message: "Spoynt create invoice failed", details: text }, { status: 502 });
        }

        const json = await r.json();

        // Очікуємо id типу cpi_...
        const cpi = json?.data?.id;
        if (!cpi) {
            return NextResponse.json({ message: "Spoynt response missing invoice id", raw: json }, { status: 502 });
        }

        // HPP redirect: {BASE COM API URL}/hpp/?cpi=<PAYMENT_INVOICE_ID> :contentReference[oaicite:5]{index=5}
        const redirectUrl = `${SPOYNT_BASE_URL}/hpp/?cpi=${encodeURIComponent(cpi)}`;

        // TODO (дуже бажано): зберегти pending транзакцію в Mongo:
        // { cpi, referenceId, userId: payload.sub, tokens, gbpAmount, status: "created" }

        return NextResponse.json({
            cpi,
            referenceId,
            tokens,
            amount: amountInCurrency,
            currency: invoiceCurrency,
            redirectUrl,
        });
    } catch (err: any) {
        return NextResponse.json({ message: err?.message || "Unknown error" }, { status: 400 });
    }
}