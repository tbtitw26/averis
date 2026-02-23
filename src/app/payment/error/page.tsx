// app/payment/error/page.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentErrorPage() {
    const sp = useSearchParams();
    const reason = sp.get("reason") || sp.get("message") || "";

    return (
        <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h1>Payment failed</h1>
            <p style={{ color: "crimson" }}>
                Your payment was not completed{reason ? `: ${reason}` : "."}
            </p>

            <div style={{ marginTop: 16 }}>
                <a href="/pricing">Try again</a>
            </div>
        </main>
    );
}