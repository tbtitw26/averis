// app/payment/error/page.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import PaymentStatusCard from "@/components/features/payment-status/PaymentStatusCard";

export default function PaymentErrorPage() {
    const sp = useSearchParams();
    const reason = sp.get("reason") || sp.get("message") || "";
    const reference = sp.get("reference") || "—";

    return (
        <PaymentStatusCard
            tone="error"
            eyebrow="Payment Failed"
            badge="No Tokens Added"
            orbLabel="Fail"
            title="The payment did not complete."
            subtitle="The provider returned a failed or cancelled result for this purchase."
            message={
                reason
                    ? `Your payment was not completed: ${reason}`
                    : "No charge was confirmed for this checkout session."
            }
            details={[
                { label: "Payment status", value: "Failed" },
                { label: "Reference", value: reference },
                { label: "Tokens credited", value: "0 tokens" },
                { label: "Next step", value: "Retry or contact support" },
            ]}
            actions={[
                { href: "/pricing", label: "Try again", variant: "primary" },
                { href: "/contact-us", label: "Contact support", variant: "secondary" },
            ]}
            timeline={[
                {
                    title: "Checkout opened",
                    text: "The payment session was created and sent to the provider.",
                    state: "done",
                },
                {
                    title: "Provider response",
                    text: "The charge was declined, cancelled, expired, or not finalized successfully.",
                    state: "warn",
                },
                {
                    title: "Token credit skipped",
                    text: "Averis does not add tokens until the provider reports a processed payment.",
                    state: "default",
                },
            ]}
            notice="If you retry, use a fresh checkout session instead of reusing an old payment page."
            meta={`Reference: ${reference}`}
        />
    );
}
