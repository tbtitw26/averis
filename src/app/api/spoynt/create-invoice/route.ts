// app/api/spoynt/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import crypto from "crypto";

const TOKENS_PER_GBP = 100;
const RATES_TO_GBP = {
    GBP: 1,
    EUR: 1.17,
    // USD: 1.27,
} as const;
const MIN_AMOUNT = 10;
const EUR_FALLBACK_MARKERS = [
    "inactive",
    "not active",
    "disabled",
    "not enabled",
    "unsupported",
    "not supported",
    "unavailable",
    "not available",
    "service",
    "currency",
];

type SupportedCurrency = keyof typeof RATES_TO_GBP;

type ReturnUrls = {
    success: string;
    fail: string;
    pending: string;
};

type CreateInvoiceAttemptArgs = {
    baseUrl: string;
    accountId: string;
    apiKey: string;
    amount: number;
    currency: SupportedCurrency;
    service: string;
    callbackUrl: string;
    returnUrls: ReturnUrls;
    referenceId: string;
    tokens: number;
    userId: string;
    requestedCurrency: SupportedCurrency;
    requestedAmount: number;
    fallbackFromCurrency?: SupportedCurrency;
};

type SpoyntInvoiceResponse = {
    data?: {
        id?: string;
    };
};

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function optionalEnv(name: string): string | null {
    const value = process.env[name]?.trim();
    return value ? value : null;
}

function basicAuthHeader(username: string, password: string) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${token}`;
}

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function getServiceForCurrency(currency: SupportedCurrency, fallback: string) {
    if (currency === "GBP") return fallback;

    const envName = `SPOYNT_DEFAULT_SERVICE_${currency}`;
    return optionalEnv(envName);
}

function shouldFallbackToGBP(currency: SupportedCurrency, details: string) {
    if (currency !== "EUR") return false;

    const normalizedDetails = details.toLowerCase();
    return EUR_FALLBACK_MARKERS.some((marker) => normalizedDetails.includes(marker));
}

async function createSpoyntInvoice({
    baseUrl,
    accountId,
    apiKey,
    amount,
    currency,
    service,
    callbackUrl,
    returnUrls,
    referenceId,
    tokens,
    userId,
    requestedCurrency,
    requestedAmount,
    fallbackFromCurrency,
}: CreateInvoiceAttemptArgs) {
    const createUrl = `${baseUrl}/payment-invoices`;

    const invoicePayload = {
        data: {
            type: "payment-invoices",
            attributes: {
                amount,
                currency,
                service,
                reference_id: referenceId,
                description: `Averis tokens: ${tokens}`,
                callback_url: callbackUrl,
                return_urls: returnUrls,
                metadata: {
                    user_id: userId,
                    tokens: String(tokens),
                    ui_currency: requestedCurrency,
                    ui_amount: String(requestedAmount),
                    charged_currency: currency,
                    charged_amount: String(amount),
                    ...(fallbackFromCurrency ? { fallback_from_currency: fallbackFromCurrency } : {}),
                },
            },
        },
    };

    const response = await fetch(createUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            Authorization: basicAuthHeader(accountId, apiKey),
        },
        body: JSON.stringify(invoicePayload),
    });

    const text = await response.text();
    let json: SpoyntInvoiceResponse | null;

    try {
        json = text ? (JSON.parse(text) as SpoyntInvoiceResponse) : null;
    } catch {
        json = null;
    }

    return {
        ok: response.ok,
        status: response.status,
        text,
        json,
        cpi: json?.data?.id as string | undefined,
    };
}

export async function POST(req: NextRequest) {
    try {
        const payload = await requireAuth(req);
        const body = await req.json().catch(() => ({}));

        // Вхідні варіанти:
        // A) preset: { tokens: number }
        // B) custom: { currency: "GBP"|"EUR", amount: number }  (сума в валюті UI)
        //    // "USD" тимчасово вимкнений

        let requestedCurrency: SupportedCurrency = "GBP";
        let requestedAmountInCurrency: number;
        let tokens: number;

        if (typeof body.tokens === "number" && body.tokens > 0) {
            tokens = Math.floor(body.tokens);
            requestedCurrency = "GBP";
            requestedAmountInCurrency = round2(tokens / TOKENS_PER_GBP);
            if (requestedAmountInCurrency < MIN_AMOUNT) {
                return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
            }
        } else if (body.currency && body.amount) {
            const currency = String(body.currency);
            if (!Object.keys(RATES_TO_GBP).includes(currency)) {
                return NextResponse.json({ message: "Unsupported currency" }, { status: 400 });
            }

            requestedCurrency = currency as SupportedCurrency;
            const amount = Number(body.amount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
            }

            requestedAmountInCurrency = round2(amount);
            if (requestedAmountInCurrency < MIN_AMOUNT) {
                return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
            }

            const gbpEquivalent = requestedAmountInCurrency / RATES_TO_GBP[requestedCurrency];
            tokens = Math.floor(gbpEquivalent * TOKENS_PER_GBP);
        } else {
            return NextResponse.json(
                { message: "Provide either {tokens} or {currency, amount}" },
                { status: 400 }
            );
        }

        const requestedGbpAmount =
            requestedCurrency === "GBP"
                ? requestedAmountInCurrency
                : round2(requestedAmountInCurrency / RATES_TO_GBP[requestedCurrency]);

        if (requestedGbpAmount < 0.01) {
            return NextResponse.json({ message: "Minimum is 0.01" }, { status: 400 });
        }

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL");
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");
        const SPOYNT_DEFAULT_SERVICE = assertEnv("SPOYNT_DEFAULT_SERVICE");
        const SPOYNT_CALLBACK_URL = assertEnv("SPOYNT_CALLBACK_URL");
        const SPOYNT_RETURN_SUCCESS = assertEnv("SPOYNT_RETURN_SUCCESS");
        const SPOYNT_RETURN_FAIL = assertEnv("SPOYNT_RETURN_FAIL");
        const SPOYNT_RETURN_PENDING = assertEnv("SPOYNT_RETURN_PENDING");

        const returnUrls: ReturnUrls = {
            success: SPOYNT_RETURN_SUCCESS,
            fail: SPOYNT_RETURN_FAIL,
            pending: SPOYNT_RETURN_PENDING,
        };

        const referenceId = crypto.randomUUID();
        let invoiceCurrency: SupportedCurrency = requestedCurrency;
        let invoiceAmount = requestedAmountInCurrency;
        let fallbackToGBP = false;

        let invoiceAttempt;

        if (requestedCurrency === "EUR") {
            const eurService = getServiceForCurrency("EUR", SPOYNT_DEFAULT_SERVICE);

            if (eurService) {
                invoiceAttempt = await createSpoyntInvoice({
                    baseUrl: SPOYNT_BASE_URL,
                    accountId: SPOYNT_ACCOUNT_ID,
                    apiKey: SPOYNT_API_KEY,
                    amount: requestedAmountInCurrency,
                    currency: "EUR",
                    service: eurService,
                    callbackUrl: SPOYNT_CALLBACK_URL,
                    returnUrls,
                    referenceId,
                    tokens,
                    userId: payload.sub,
                    requestedCurrency,
                    requestedAmount: requestedAmountInCurrency,
                });
            }

            if (!eurService || (invoiceAttempt && !invoiceAttempt.ok && shouldFallbackToGBP("EUR", invoiceAttempt.text))) {
                fallbackToGBP = true;
                invoiceCurrency = "GBP";
                invoiceAmount = requestedGbpAmount;

                invoiceAttempt = await createSpoyntInvoice({
                    baseUrl: SPOYNT_BASE_URL,
                    accountId: SPOYNT_ACCOUNT_ID,
                    apiKey: SPOYNT_API_KEY,
                    amount: requestedGbpAmount,
                    currency: "GBP",
                    service: SPOYNT_DEFAULT_SERVICE,
                    callbackUrl: SPOYNT_CALLBACK_URL,
                    returnUrls,
                    referenceId,
                    tokens,
                    userId: payload.sub,
                    requestedCurrency,
                    requestedAmount: requestedAmountInCurrency,
                    fallbackFromCurrency: "EUR",
                });
            }
        } else {
            invoiceAttempt = await createSpoyntInvoice({
                baseUrl: SPOYNT_BASE_URL,
                accountId: SPOYNT_ACCOUNT_ID,
                apiKey: SPOYNT_API_KEY,
                amount: requestedAmountInCurrency,
                currency: requestedCurrency,
                service: SPOYNT_DEFAULT_SERVICE,
                callbackUrl: SPOYNT_CALLBACK_URL,
                returnUrls,
                referenceId,
                tokens,
                userId: payload.sub,
                requestedCurrency,
                requestedAmount: requestedAmountInCurrency,
            });
        }

        if (!invoiceAttempt?.ok) {
            return NextResponse.json(
                { message: "Spoynt create invoice failed", details: invoiceAttempt?.text || "Unknown provider error" },
                { status: 502 }
            );
        }

        const cpi = invoiceAttempt.cpi;
        if (!cpi) {
            return NextResponse.json(
                { message: "Spoynt response missing invoice id", raw: invoiceAttempt.json },
                { status: 502 }
            );
        }

        const redirectUrl = `${SPOYNT_BASE_URL}/hpp/?cpi=${encodeURIComponent(cpi)}`;

        return NextResponse.json({
            cpi,
            referenceId,
            tokens,
            amount: invoiceAmount,
            currency: invoiceCurrency,
            requestedCurrency,
            fallbackToGBP,
            redirectUrl,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ message }, { status: 400 });
    }
}