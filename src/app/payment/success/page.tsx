// app/payment/success/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
    const sp = useSearchParams();
    const router = useRouter();

    const cpi = sp.get("cpi") || sp.get("invoice") || "";
    const [state, setState] = useState<"loading" | "ok" | "pending" | "error">("loading");
    const [msg, setMsg] = useState<string>("");

    useEffect(() => {
        if (!cpi) {
            setState("error");
            setMsg("Missing payment reference (cpi).");
            return;
        }

        let cancelled = false;

        const run = async () => {
            try {
                const res = await fetch(`/api/spoynt/confirm?cpi=${encodeURIComponent(cpi)}`, {
                    method: "GET",
                    credentials: "include",
                });

                const text = await res.text();
                if (!res.ok) throw new Error(text);

                const data = JSON.parse(text);

                if (cancelled) return;

                if (data.status === "credited") {
                    setState("ok");
                    setMsg(`Tokens credited: ${data.tokens}. New balance: ${data.user?.tokens ?? "—"}`);
                } else if (data.status === "pending") {
                    setState("pending");
                    setMsg("Payment is still processing. We’ll refresh automatically.");
                    // авто-рефреш через 2с
                    setTimeout(() => router.refresh(), 2000);
                } else {
                    setState("error");
                    setMsg(data.message || "Payment not confirmed.");
                }
            } catch (e: any) {
                if (cancelled) return;
                setState("error");
                setMsg(e?.message || "Something went wrong.");
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [cpi, router]);

    return (
        <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h1>Payment success</h1>

            {state === "loading" && <p>Confirming payment…</p>}
            {state === "pending" && <p>{msg}</p>}
            {state === "ok" && (
                <>
                    <p>{msg}</p>
                    <a href="/dashboard">Go to dashboard</a>
                </>
            )}
            {state === "error" && (
                <>
                    <p style={{ color: "crimson" }}>{msg}</p>
                    <a href="/pricing">Back to pricing</a>
                </>
            )}

            <p style={{ opacity: 0.6, marginTop: 16 }}>Reference: {cpi || "—"}</p>
        </main>
    );
}