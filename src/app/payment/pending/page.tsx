"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import PaymentStatusCard from "@/components/features/payment-status/PaymentStatusCard";

export default function PaymentPendingPage() {
    const sp = useSearchParams();
    const reference = sp.get("reference") || "";
    const cpi = sp.get("cpi") || "";

    const checkHref = reference
        ? `/payment/success?reference=${encodeURIComponent(reference)}${cpi ? `&cpi=${encodeURIComponent(cpi)}` : ""}`
        : "/payment/success";

    return (
        <PaymentStatusCard
            tone="pending"
            eyebrow="Payment Pending"
            badge="Awaiting Provider Update"
            orbLabel="Wait"
            title="Your payment is still in progress."
            subtitle="This usually means the bank, card network, or acquirer has not returned the final result yet."
            message="Averis will only credit tokens after the payment reaches a processed state. You can re-check the status from this screen."
            details={[
                { label: "Payment status", value: "Pending" },
                { label: "Reference", value: reference || "—" },
                { label: "Provider invoice", value: cpi || "—" },
                { label: "Token credit", value: "Waiting for confirmation" },
            ]}
            actions={[
                { href: checkHref, label: "Check payment status", variant: "primary" },
                { href: "/dashboard", label: "Go to dashboard", variant: "secondary" },
            ]}
            timeline={[
                {
                    title: "Invoice created",
                    text: "The checkout session exists and is linked to your Averis order.",
                    state: "done",
                },
                {
                    title: "Provider processing",
                    text: "The payment processor has not yet returned a final processed or failed state.",
                    state: "active",
                },
                {
                    title: "Automatic credit",
                    text: "Once confirmed, token crediting happens on the server without extra action from you.",
                    state: "default",
                },
            ]}
            notice="Avoid submitting a duplicate payment while this one is still pending unless support tells you the original session is closed."
            meta={`Reference: ${reference || "—"}`}
        />
    );
}
