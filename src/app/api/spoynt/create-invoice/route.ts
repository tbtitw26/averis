// app/api/spoynt/create-invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import { connectDB } from "@/backend/config/db";
import { User } from "@/backend/models/user.model";
import { spoyntService } from "@/backend/services/spoynt.service";
import crypto from "crypto";

const TOKENS_PER_GBP = 100;
const RATES_TO_GBP = {
    AUD: 2.04,
    CAD: 1.76,
    NZD: 2.22,
} as const;
const MIN_AMOUNT = 10;

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
    userEmail: string;
    customer?: {
        name?: string;
        first_name?: string;
        surname?: string;
        phone?: string;
        date_of_birth?: string;
        address?: {
            street?: string;
            city?: string;
            country?: string;
            post_code?: string;
        };
    };
    fallbackFromCurrency?: SupportedCurrency;
};

type SpoyntInvoiceResponse = {
    data?: {
        id?: string;
        attributes?: {
            status?: string;
            resolution?: string | null;
            updated?: number;
            hpp_url?: string;
            flow_data?: {
                action?: string;
                method?: string;
                params?: Record<string, string> | Array<{ name?: string; value?: string }> | string[];
            } | [];
        };
    };
};

type RedirectInstruction = {
    url: string;
    method: "GET" | "POST";
    params: Record<string, string>;
};

function paymentLog(event: string, payload: Record<string, unknown>) {
    console.info(
        JSON.stringify({
            scope: "spoynt.create_invoice",
            event,
            ts: new Date().toISOString(),
            ...payload,
        }, null, 2)
    );
}

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

function getServiceForCurrency(currency: SupportedCurrency) {
    const envName = `SPOYNT_DEFAULT_SERVICE_${currency}`;
    const service = optionalEnv(envName);

    if (service) {
        return service;
    }

    return `payment_card_${currency.toLowerCase()}_hpp`;
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
    userEmail,
    customer,
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
                flow: "charge",
                reference_id: referenceId,
                description: `Averis tokens: ${tokens}`,
                callback_url: callbackUrl,
                return_urls: returnUrls,
                customer: {
                    reference_id: userId,
                    email: userEmail,
                    ...(customer?.name ? { name: customer.name } : {}),
                    ...(customer?.first_name ? { first_name: customer.first_name } : {}),
                    ...(customer?.surname ? { surname: customer.surname } : {}),
                    ...(customer?.phone ? { phone: customer.phone } : {}),
                    ...(customer?.date_of_birth ? { date_of_birth: customer.date_of_birth } : {}),
                    ...(customer?.address && Object.keys(customer.address).length > 0
                        ? { address: customer.address }
                        : {}),
                },
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

function normalizeRedirectParams(
    raw: Record<string, string> | Array<{ name?: string; value?: string }> | string[] | undefined
) {
    if (!raw) return {};

    if (Array.isArray(raw)) {
        return raw.reduce<Record<string, string>>((acc, item, index) => {
            if (typeof item === "string") {
                acc[String(index)] = item;
                return acc;
            }

            if (item?.name) {
                acc[item.name] = item.value ?? "";
            }

            return acc;
        }, {});
    }

    return Object.entries(raw).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = String(value ?? "");
        return acc;
    }, {});
}

function resolveRedirectInstruction(
    invoice: SpoyntInvoiceResponse | null,
): RedirectInstruction | null {
    const attrs = invoice?.data?.attributes;
    const hppUrl = attrs?.hpp_url?.trim();

    if (hppUrl) {
        return {
            url: hppUrl,
            method: "GET",
            params: {},
        };
    }

    const flowData = Array.isArray(attrs?.flow_data) ? null : attrs?.flow_data;
    const action = flowData?.action?.trim();

    if (action) {
        return {
            url: action,
            method: flowData?.method?.toUpperCase() === "POST" ? "POST" : "GET",
            params: normalizeRedirectParams(flowData?.params),
        };
    }
    
    return null;
}

export async function POST(req: NextRequest) {
    try {
        paymentLog("request.received", { path: req.nextUrl.pathname });
        const payload = await requireAuth(req);
        const body = await req.json().catch(() => ({}));
        paymentLog("request.authenticated", { userId: payload.sub, email: payload.email, body });
        await connectDB();
        const user = await User.findById(payload.sub).lean();

        // Вхідні варіанти:
        // A) preset: { tokens: number }
        // B) custom: { currency: "AUD"|"CAD"|"NZD", amount: number }  (сума в валюті UI)

        let requestedCurrency: SupportedCurrency = "AUD";
        let requestedAmountInCurrency: number;
        let tokens: number;

        if (typeof body.tokens === "number" && body.tokens > 0) {
            tokens = Math.floor(body.tokens);
            if (!body.currency || !Object.keys(RATES_TO_GBP).includes(String(body.currency))) {
                return NextResponse.json({ message: "Unsupported currency" }, { status: 400 });
            }
            requestedCurrency = String(body.currency) as SupportedCurrency;
            requestedAmountInCurrency = round2((tokens / TOKENS_PER_GBP) * RATES_TO_GBP[requestedCurrency]);
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

        if (round2(requestedAmountInCurrency / RATES_TO_GBP[requestedCurrency]) < 0.01) {
            return NextResponse.json({ message: "Minimum is 0.01" }, { status: 400 });
        }

        paymentLog("invoice.normalized", {
            userId: payload.sub,
            requestedCurrency,
            requestedAmountInCurrency,
            requestedAmountInGbp: round2(requestedAmountInCurrency / RATES_TO_GBP[requestedCurrency]),
            tokens,
        });

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL");
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");
        const SPOYNT_CALLBACK_URL = assertEnv("SPOYNT_CALLBACK_URL");
        const SPOYNT_RETURN_SUCCESS = assertEnv("SPOYNT_RETURN_SUCCESS");
        const SPOYNT_RETURN_FAIL = assertEnv("SPOYNT_RETURN_FAIL");
        const SPOYNT_RETURN_PENDING = assertEnv("SPOYNT_RETURN_PENDING");

        const withReference = (url: string) => {
            const target = new URL(url);
            target.searchParams.set("reference", referenceId);
            return target.toString();
        };

        const referenceId = crypto.randomUUID();
        const returnUrls: ReturnUrls = {
            success: withReference(SPOYNT_RETURN_SUCCESS),
            fail: withReference(SPOYNT_RETURN_FAIL),
            pending: withReference(SPOYNT_RETURN_PENDING),
        };
        const customer =
            user
                ? {
                    ...(user.name ? { name: user.name } : {}),
                    ...(user.firstName ? { first_name: user.firstName } : {}),
                    ...(user.lastName ? { surname: user.lastName } : {}),
                    ...(user.phoneNumber ? { phone: user.phoneNumber } : {}),
                    ...(user.dateOfBirth
                        ? { date_of_birth: new Date(user.dateOfBirth).toISOString().slice(0, 10) }
                        : {}),
                    address: {
                        ...(user.street ? { street: user.street } : {}),
                        ...(user.city ? { city: user.city } : {}),
                        ...(user.postCode ? { post_code: user.postCode } : {}),
                    },
                }
                : undefined;
        const invoiceCurrency: SupportedCurrency = requestedCurrency;
        const invoiceAmount = requestedAmountInCurrency;
        const fallbackToGBP = false;
        const selectedService = getServiceForCurrency(requestedCurrency);

        paymentLog("invoice.service.selected", {
            requestedCurrency,
            service: selectedService,
        });
        paymentLog("provider.request.start", {
            currency: requestedCurrency,
            amount: requestedAmountInCurrency,
            service: selectedService,
            referenceId,
        });
        const invoiceAttempt = await createSpoyntInvoice({
            baseUrl: SPOYNT_BASE_URL,
            accountId: SPOYNT_ACCOUNT_ID,
            apiKey: SPOYNT_API_KEY,
            amount: requestedAmountInCurrency,
            currency: requestedCurrency,
            service: selectedService,
            callbackUrl: SPOYNT_CALLBACK_URL,
            returnUrls,
            referenceId,
            tokens,
            userId: payload.sub,
            requestedCurrency,
            requestedAmount: requestedAmountInCurrency,
            userEmail: payload.email,
            customer,
        });
        paymentLog("provider.request.finish", {
            currency: requestedCurrency,
            amount: requestedAmountInCurrency,
            service: selectedService,
            referenceId,
            ok: invoiceAttempt.ok,
            statusCode: invoiceAttempt.status,
            cpi: invoiceAttempt.cpi ?? null,
        });

        if (!invoiceAttempt?.ok) {
            console.error("[spoynt:create-invoice] provider_error", {
                status: invoiceAttempt?.status,
                details: invoiceAttempt?.text,
                requestedCurrency,
                requestedAmountInCurrency,
                invoiceCurrency,
                invoiceAmount,
            });
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

        await spoyntService.upsertCreatedInvoice({
            cpi,
            referenceId,
            userId: payload.sub,
            tokens,
            requestedCurrency,
            requestedAmount: requestedAmountInCurrency,
            chargedCurrency: invoiceCurrency,
            chargedAmount: invoiceAmount,
            status: invoiceAttempt.json?.data?.attributes?.status || "created",
            resolution: invoiceAttempt.json?.data?.attributes?.resolution ?? null,
            providerUpdatedAt: invoiceAttempt.json?.data?.attributes?.updated ?? null,
        });
        paymentLog("invoice.persisted", {
            userId: payload.sub,
            referenceId,
            cpi,
            chargedCurrency: invoiceCurrency,
            chargedAmount: invoiceAmount,
            requestedCurrency,
            requestedAmount: requestedAmountInCurrency,
            tokens,
        });

        const redirect = resolveRedirectInstruction(invoiceAttempt.json);

        if (!redirect) {
            console.error("[spoynt:create-invoice] missing_redirect_data", {
                cpi,
                raw: invoiceAttempt.json,
            });
            return NextResponse.json(
                { message: "Spoynt response missing redirect data", raw: invoiceAttempt.json },
                { status: 502 }
            );
        }

        paymentLog("redirect.resolved", {
            referenceId,
            cpi,
            redirectMethod: redirect.method,
            redirectUrl: redirect.url,
            redirectParamKeys: Object.keys(redirect.params),
        });

        return NextResponse.json({
            cpi,
            referenceId,
            tokens,
            amount: invoiceAmount,
            currency: invoiceCurrency,
            requestedCurrency,
            fallbackToGBP,
            redirectUrl: redirect.url,
            redirectMethod: redirect.method,
            redirectParams: redirect.params,
            redirect,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        paymentLog("request.failed", { message });
        return NextResponse.json({ message }, { status: 400 });
    }
}
