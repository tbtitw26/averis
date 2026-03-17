"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PaymentStatusCard from "@/components/features/payment-status/PaymentStatusCard";

type AddTransaction = {
    _id: string;
    amount: number;
    type: "add" | "spend";
    balanceAfter: number;
    createdAt: string;
};

type ConfirmPaymentResponse = {
    status?: "credited" | "pending" | "failed";
    message?: string;
    tokens?: number;
    balanceAfter?: number | null;
};

export default function PaymentSuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const [referenceValue, setReferenceValue] = useState<string>("");
    const [cpiValue, setCpiValue] = useState<string>("");
    const [state, setState] = useState<"loading" | "ok" | "pending" | "error">("loading");
    const [msg, setMsg] = useState<string>("");
    const [creditedTokens, setCreditedTokens] = useState<number | null>(null);
    const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
    const [latestTransaction, setLatestTransaction] = useState<AddTransaction | null>(null);
    const [pendingPurchase, setPendingPurchase] = useState<{
        tokens: number;
        createdAt: number;
    } | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const hasAppliedRef = useRef(false);

    useEffect(() => {
        setIsMounted(true);
        setReferenceValue(sp.get("reference") || "");
        setCpiValue(sp.get("cpi") || sp.get("invoice") || "");
        try {
            const raw = localStorage.getItem("pendingPurchase");
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || !Number.isFinite(parsed.tokens)) return;
            setPendingPurchase({
                tokens: Number(parsed.tokens),
                createdAt: Number(parsed.createdAt) || Date.now(),
            });
        } catch {
            setPendingPurchase(null);
        }
    }, [sp]);

    useEffect(() => {
        if (!isMounted) return;

        if (!referenceValue) {
            setState("error");
            setMsg("Missing payment reference.");
            return;
        }

        if (!pendingPurchase || !Number.isFinite(pendingPurchase.tokens) || pendingPurchase.tokens <= 0) {
            setState("error");
            setMsg("Missing selected package.");
            return;
        }

        if (hasAppliedRef.current) return;
        hasAppliedRef.current = true;

        let cancelled = false;

        const loadLatestTransaction = async () => {
            try {
                const res = await fetch("/api/transactions/get-all", { credentials: "include" });
                if (!res.ok) return;
                const data = (await res.json()) as { transactions?: AddTransaction[] };
                const tx = Array.isArray(data.transactions)
                    ? data.transactions.find((t) => t?.type === "add")
                    : null;
                if (!cancelled) setLatestTransaction(tx || null);
            } catch {
                if (!cancelled) setLatestTransaction(null);
            }
        };

        const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

        const confirmPayment = async () => {
            try {
                const runConfirm = async () =>
                    fetch(`/api/spoynt/status/${encodeURIComponent(referenceValue)}`, {
                        method: "GET",
                        credentials: "include",
                    });

                for (let attempt = 0; attempt < 10; attempt += 1) {
                    if (cancelled) return;

                    setState(attempt === 0 ? "loading" : "pending");
                    setMsg(attempt === 0 ? "Confirming your payment..." : "Payment is still processing. Re-checking...");

                    let res = await runConfirm();
                    let data = (await res.json().catch(() => ({}))) as ConfirmPaymentResponse;

                    if (!res.ok) {
                        const isAuthError =
                            res.status === 401 ||
                            /Missing auth|Invalid or expired token/i.test(String(data?.message || ""));

                        if (isAuthError) {
                            const refreshRes = await fetch("/api/auth/refresh", {
                                method: "POST",
                                credentials: "include",
                            });
                            if (refreshRes.ok) {
                                res = await runConfirm();
                                data = (await res.json().catch(() => ({}))) as ConfirmPaymentResponse;
                            }
                        }
                    }

                    if (!res.ok) throw new Error(data?.message || "Failed to confirm payment");

                    if (data?.status === "pending") {
                        await sleep(3000);
                        continue;
                    }

                    if (data?.status !== "credited") {
                        throw new Error(data?.message || "Payment was not confirmed");
                    }

                    if (cancelled) return;
                    setState("ok");
                    setCreditedTokens(data?.tokens ?? pendingPurchase.tokens);
                    setBalanceAfter(data?.balanceAfter ?? null);
                    setMsg(
                        `Tokens credited: ${data?.tokens ?? pendingPurchase.tokens}. New balance: ${data?.balanceAfter ?? "—"}`
                    );
                    localStorage.removeItem("pendingPurchase");
                    await loadLatestTransaction();
                    setTimeout(() => router.push("/dashboard"), 800);
                    return;
                }

                throw new Error("Payment is still pending. Please refresh this page in a moment.");
            } catch (e: unknown) {
                if (cancelled) return;
                setState("error");
                setMsg(e instanceof Error ? e.message : "Something went wrong.");
            }
        };

        confirmPayment();

        return () => {
            cancelled = true;
        };
    }, [isMounted, pendingPurchase, referenceValue, router]);

    const formattedPendingDate = pendingPurchase
        ? new Date(pendingPurchase.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

    const statusConfig =
        state === "ok"
            ? {
                tone: "success" as const,
                eyebrow: "Payment Confirmed",
                badge: "Tokens Credited",
                orbLabel: "Paid",
                title: "Purchase completed.",
                subtitle: "Your balance has been updated and the invoice has been sent by email.",
                notice:
                    "If the balance on your dashboard looks stale for a moment, refresh the page. The payment itself is already confirmed.",
                timeline: [
                    {
                        title: "Invoice created",
                        text: "Spoynt accepted the payment session and returned a hosted checkout page.",
                        state: "done" as const,
                    },
                    {
                        title: "Provider confirmed",
                        text: "The payment moved into the processed state and passed reconciliation.",
                        state: "done" as const,
                    },
                    {
                        title: "Tokens added",
                        text: "Your Averis balance was credited and stored server-side.",
                        state: "done" as const,
                    },
                ],
            }
            : state === "pending"
                ? {
                    tone: "pending" as const,
                    eyebrow: "Payment Processing",
                    badge: "Awaiting Final State",
                    orbLabel: "Wait",
                    title: "We are still checking the payment.",
                    subtitle: "The provider has not finalized the charge yet, so we are polling the status for you.",
                    notice:
                        "Do not start a second payment for the same purchase unless this status later switches to failed.",
                    timeline: [
                        {
                            title: "Invoice created",
                            text: "Your payment session exists and the reference is valid.",
                            state: "done" as const,
                        },
                        {
                            title: "Bank or acquirer response",
                            text: "The payment provider is still finalizing authorization or capture.",
                            state: "active" as const,
                        },
                        {
                            title: "Tokens added",
                            text: "Tokens will be credited automatically right after the payment is processed.",
                            state: "default" as const,
                        },
                    ],
                }
                : state === "error"
                    ? {
                        tone: "error" as const,
                        eyebrow: "Payment Problem",
                        badge: "Action Needed",
                        orbLabel: "Fail",
                        title: "We could not verify this payment.",
                        subtitle: "The payment may have failed, expired, or the confirmation could not be completed.",
                        notice:
                            "If funds were captured but you still see this screen, contact support and include the reference shown below.",
                        timeline: [
                            {
                                title: "Session found",
                                text: "We received the payment reference and attempted reconciliation.",
                                state: "done" as const,
                            },
                            {
                                title: "Verification failed",
                                text: "The latest provider status did not allow token crediting.",
                                state: "warn" as const,
                            },
                            {
                                title: "Manual help",
                                text: "Support can inspect the provider reference and webhook history if needed.",
                                state: "default" as const,
                            },
                        ],
                    }
                    : {
                        tone: "loading" as const,
                        eyebrow: "Payment Sync",
                        badge: "Checking Status",
                        orbLabel: "Sync",
                        title: "Finalizing your purchase.",
                        subtitle: "We are reconciling the latest provider state before releasing tokens.",
                        notice:
                            "This usually finishes within a few seconds. Leave this tab open until the state updates.",
                        timeline: [
                            {
                                title: "Reference received",
                                text: "Your browser returned with a valid Averis payment reference.",
                                state: "done" as const,
                            },
                            {
                                title: "Status lookup",
                                text: "Averis is calling the server-side reconciliation route now.",
                                state: "active" as const,
                            },
                            {
                                title: "Credit tokens",
                                text: "Once the provider confirms payment, your token balance is updated automatically.",
                                state: "default" as const,
                            },
                        ],
                    };

    const details = [
        {
            label: "Selected package",
            value: isMounted && pendingPurchase ? `${pendingPurchase.tokens} tokens` : "—",
        },
        {
            label: "Reference",
            value: isMounted ? referenceValue || cpiValue || "—" : "—",
        },
        {
            label: "Credited tokens",
            value: creditedTokens !== null ? `${creditedTokens} tokens` : "—",
        },
        {
            label: "Balance after",
            value: balanceAfter !== null ? `${balanceAfter} tokens` : "—",
        },
        {
            label: "Order synced",
            value: latestTransaction ? "Yes" : state === "ok" ? "Pending sync" : "—",
        },
        {
            label: "Selected at",
            value: isMounted ? formattedPendingDate : "—",
        },
    ];

    const actions =
        state === "ok"
            ? [
                { href: "/dashboard", label: "Open dashboard", variant: "primary" as const },
                { href: "/pricing", label: "Buy more tokens", variant: "secondary" as const },
            ]
            : state === "error"
                ? [
                    { href: "/pricing", label: "Back to pricing", variant: "primary" as const },
                    { href: "/contact-us", label: "Contact support", variant: "secondary" as const },
                ]
                : state === "pending"
                    ? [
                        {
                            href: `/payment/success?reference=${encodeURIComponent(referenceValue)}${cpiValue ? `&cpi=${encodeURIComponent(cpiValue)}` : ""}`,
                            label: "Check again",
                            variant: "primary" as const,
                        },
                        { href: "/dashboard", label: "Go to dashboard", variant: "secondary" as const },
                    ]
                    : [
                        { href: "/pricing", label: "Back to pricing", variant: "secondary" as const },
                    ];

    return (
        <PaymentStatusCard
            tone={statusConfig.tone}
            eyebrow={statusConfig.eyebrow}
            badge={statusConfig.badge}
            orbLabel={statusConfig.orbLabel}
            title={statusConfig.title}
            subtitle={statusConfig.subtitle}
            message={msg || "Confirming payment..."}
            details={details}
            actions={actions}
            timeline={statusConfig.timeline}
            notice={statusConfig.notice}
            meta={`Reference: ${isMounted ? referenceValue || cpiValue || "—" : "—"}`}
        />
    );
}
