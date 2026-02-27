"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./PaymentSuccess.module.scss";

export default function PaymentSuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const [cpiValue, setCpiValue] = useState<string>("");
    const [state, setState] = useState<"loading" | "ok" | "pending" | "error">("loading");
    const [msg, setMsg] = useState<string>("");
    const [creditedTokens, setCreditedTokens] = useState<number | null>(null);
    const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
    const [latestTransaction, setLatestTransaction] = useState<{
        _id: string;
        amount: number;
        type: "add" | "spend";
        balanceAfter: number;
        createdAt: string;
    } | null>(null);
    const [pendingPurchase, setPendingPurchase] = useState<{
        tokens: number;
        createdAt: number;
    } | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const hasAppliedRef = useRef(false);

    const badgeClass =
        state === "ok"
            ? styles.badgeOk
            : state === "pending"
                ? styles.badgePending
                : state === "error"
                    ? styles.badgeError
                    : styles.badgeLoading;

    useEffect(() => {
        setIsMounted(true);
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
                const data = await res.json();
                const tx = Array.isArray(data.transactions)
                    ? data.transactions.find((t: any) => t?.type === "add")
                    : null;
                if (!cancelled) setLatestTransaction(tx || null);
            } catch {
                if (!cancelled) setLatestTransaction(null);
            }
        };

        const applyTokens = async () => {
            try {
                setState("loading");
                setMsg("Crediting your tokens...");

                const runBuyTokens = async () =>
                    fetch("/api/user/buy-tokens", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ amount: pendingPurchase.tokens }),
                    });

                let res = await runBuyTokens();
                let data = await res.json().catch(() => ({}));

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
                            res = await runBuyTokens();
                            data = await res.json().catch(() => ({}));
                        }
                    }
                }

                if (!res.ok) throw new Error(data?.message || "Failed to credit tokens");

                if (cancelled) return;
                setState("ok");
                setCreditedTokens(pendingPurchase.tokens);
                setBalanceAfter(data?.user?.tokens ?? null);
                setMsg(`Tokens credited: ${pendingPurchase.tokens}. New balance: ${data?.user?.tokens ?? "—"}`);
                localStorage.removeItem("pendingPurchase");
                await loadLatestTransaction();
                setTimeout(() => router.push("/dashboard"), 800);
            } catch (e: any) {
                if (cancelled) return;
                setState("error");
                setMsg(e?.message || "Something went wrong.");
            }
        };

        applyTokens();

        return () => {
            cancelled = true;
        };
    }, [isMounted, pendingPurchase, router]);

    const formattedPendingDate = pendingPurchase
        ? new Date(pendingPurchase.createdAt).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Payment success</h1>
                        <p className={styles.subtitle}>We are syncing your tokens and order.</p>
                    </div>
                    <span className={`${styles.badge} ${badgeClass}`}>
                        {state === "ok"
                            ? "Confirmed"
                            : state === "pending"
                                ? "Pending"
                                : state === "error"
                                    ? "Error"
                                    : "Loading"}
                    </span>
                </div>

                <p className={styles.message}>{msg || "Confirming payment..."}</p>

                <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                        <span>Selected package</span>
                        <span className={styles.detailValue}>
                            {isMounted && pendingPurchase ? `${pendingPurchase.tokens} tokens` : "—"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Reference</span>
                        <span className={styles.detailValue}>{isMounted ? cpiValue || "—" : "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Credited tokens</span>
                        <span className={styles.detailValue}>
                            {creditedTokens !== null ? `${creditedTokens} tokens` : "—"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Balance after</span>
                        <span className={styles.detailValue}>
                            {balanceAfter !== null ? `${balanceAfter} tokens` : "—"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Order created</span>
                        <span className={styles.detailValue}>
                            {latestTransaction ? "Yes" : state === "ok" ? "Pending sync" : "—"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Selected at</span>
                        <span className={styles.detailValue}>{isMounted ? formattedPendingDate : "—"}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    {state === "ok" && (
                        <>
                            <a className={styles.primaryBtn} href="/dashboard">
                                Go to dashboard
                            </a>
                            <a className={styles.secondaryBtn} href="/pricing">
                                Buy more tokens
                            </a>
                        </>
                    )}
                    {state === "error" && (
                        <>
                            <a className={styles.primaryBtn} href="/pricing">
                                Back to pricing
                            </a>
                            <a className={styles.secondaryBtn} href="/contact-us">
                                Contact support
                            </a>
                        </>
                    )}
                    {state === "pending" && (
                        <a className={styles.secondaryBtn} href="/dashboard">
                            Go to dashboard
                        </a>
                    )}
                </div>

                <p className={styles.meta}>Reference: {isMounted ? cpiValue || "—" : "—"}</p>
            </section>
        </main>
    );
}