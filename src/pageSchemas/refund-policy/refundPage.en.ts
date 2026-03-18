import { PageSchema } from "@/components/constructor/page-render/types";

const refundPolicySchema: PageSchema = {
    meta: {
        title: "Refund / Return Policy – Averis",
        description:
            "Official Refund / Return Policy for Averis: refunds for tokens, workout plans, digital services, and consumer rights.",
        keywords: [
            "refund policy",
            "return policy",
            "averis",
            "tokens",
            "AI fitness",
            "digital content",
            "consumer rights",
        ],
        canonical: "/refund-policy",
        ogImage: {
            title: "Averis – Refund / Return Policy",
            description:
                "Transparent refund and return policy for Averis AI workout plans and token system.",
            bg: "#ffffff",
            color: "#000000",
        },
    },
    blocks: [
        {
            type: "text",
            title: "Refund / Return Policy",
            description: "Effective date: 18 October 2025",
        },
        {
            type: "text",
            title: "1. Summary (customer-facing)",
            bullets: [
                "Refunds are assessed under this Policy and applicable consumer law.",
                "Typical processing time: 5–10 business days after approval (payment-provider timelines may vary).",
                "A refund will not exceed the amount originally paid for the relevant Token top-up or transaction.",
                "Spent Tokens (i.e., redeemed for Workout Plans/Services) are non-refundable, except as set out in §4.2.",
                "Tokens are account-bound, non-transferable, and cannot be exchanged for real currency.",
                "Promotional/bonus Tokens are non-refundable in all circumstances.",
                "Submit requests to info@averis.co.uk with your order reference and details.",
                "This Policy may be updated; material changes will be notified as described in §8.",
                "If you consented to immediate supply and opened/downloaded the digital content, your statutory right to cancel may be lost (see §4.7).",
                "Accepted currencies: AUD (A$), CAD (C$), NZD (NZ$). Payment methods: Visa, Mastercard.",
            ],
        },
        {
            type: "text",
            title: "2. Scope and Legal Note",
            description:
                "This Policy governs refunds for Tokens (internal credits) and digital Workout Plans/Services supplied by SHIREDON LIMITED via averis.co.uk. Nothing in this Policy overrides statutory consumer rights under UK law, including the Consumer Contracts Regulations 2013 and the Consumer Rights Act 2015.",
        },
        {
            type: "text",
            title: "3. Definitions",
            bullets: [
                "Tokens / Credits — internal prepaid credits used on the Service. The current purchase rate (e.g., £1.00 ≈ 100 Tokens or €1.17 ≈ 100 Tokens) is displayed at the time of purchase and may change from time to time.",
                "Unused Tokens — Tokens credited to your Account but not yet redeemed.",
                "Redeemed / Spent Tokens — Tokens already used to access or generate a Workout Plan/Service.",
                "Promotional / Bonus Tokens — Tokens issued as part of a promotion, bonus, or incentive and marked as such.",
            ],
        },
        {
            type: "text",
            title: "4. Refund Principles (binding rules)",
            description:
                "4.1. Refund amount cap. Any refund will not exceed the original amount paid for the relevant Token top-up or transaction, net of any non-refundable processor fees (where permitted by law and the provider’s rules).\n\n" +
                "4.2. No refund for spent Tokens (exceptions). Redeemed Tokens are non-refundable, except where:\n(a) the Workout Plan or Service is defective or not as described; or\n(b) Averis fails to supply the Service as contracted; or\n(c) a refund is otherwise required by law.\n\n" +
                "4.3. Unused Tokens. Unused Tokens are generally refundable at the original purchase price if requested before any redemption from that top-up. Non-recoverable payment-processing fees may be deducted.\n\n" +
                "4.4. Account-bound. Tokens are tied to your Account and cannot be transferred between accounts.\n\n" +
                "4.5. No cash-out. Tokens cannot be exchanged for cash or other currencies, unless required by law.\n\n" +
                "4.6. Promotional Tokens. Bonus/promotional Tokens are non-refundable under all circumstances.\n\n" +
                "4.7. Immediate supply of digital content. If you consent to immediate delivery and open/download the content (e.g., generated PDF), you acknowledge your statutory right to cancel may not apply. Refunds are only available under §4.2 or where required by law.\n\n" +
                "4.8. Bespoke/custom work. Custom Workout Plans are non-refundable once preparation has substantially begun, unless otherwise agreed in writing.\n\n" +
                "4.9. Standard plan & add-ons (pricing clarity). Standard generation and add-ons have clear token prices shown before confirmation; once redeemed, non-refundable except under §4.2.",
        },
        {
            type: "text",
            title: "5. How to Request a Refund (Procedure)",
            bullets: [
                "Order reference number.",
                "Account email used for purchase.",
                "Whether the request concerns Unused Tokens or a Redeemed item.",
                "For redeemed items: a description of the issue and supporting evidence (screenshots, file details).",
                "Preferred refund method (original payment method is standard).",
                "Upon receipt we will: acknowledge within 5 business days, investigate and, if needed, request more details, provide a decision, and if approved, process the refund within 5–10 business days (subject to provider timelines).",
            ],
        },
        {
            type: "text",
            title: "6. Investigation, Evidence and Decisions",
            description:
                "6.1. For claims involving redeemed content, we may review token transaction logs, checkout confirmations, delivery/access logs, and customer evidence.\n\n" +
                "6.2. Refunds are normally processed to the original payment method; if not possible, an alternative (e.g., bank transfer) may be offered after verification.\n\n" +
                "6.3. If a claim is rejected, we will provide reasons and inform you of options to escalate or pursue legal remedies.",
        },
        {
            type: "text",
            title: "7. Chargebacks, Fraud and Abuse",
            description:
                "If a chargeback is initiated while a refund request is pending, we treat it as a dispute and submit full transaction evidence to the payment provider. We may refuse refunds and suspend Accounts in cases of suspected fraud, abuse, or repeated chargebacks. Where funds are reversed, equivalent Tokens and access to related content may be removed.",
        },
        {
            type: "text",
            title: "8. Changes to this Policy",
            description:
                "We may update this Policy at any time. Material changes will be notified by email or in-product notice. Changes apply prospectively and do not affect previously completed transactions unless required by law.",
        },
        {
            type: "text",
            title: "9. Record Keeping and Retention",
            description:
                "We retain records relevant to refund requests and disputes — including order IDs, token purchase/redemption history, checkout acceptance, timestamps, IP, and device information — for at least 24 months, and up to 6 years for enterprise or disputed transactions, in line with our Privacy Policy and applicable data-protection law.",
        },
        {
            type: "text",
            title: "10. Escalation and Disputes",
            description:
                "If you disagree with a decision, you may escalate by emailing info@averis.co.uk with full reasons and your order reference. We will review within 10 business days. This Policy does not affect your statutory rights; you may pursue ADR or court proceedings as applicable.",
        },
        {
            type: "text",
            title: "11. Examples (Practical, Illustrative)",
            bullets: [
                "Unused Tokens (AUD): Purchase 2,000 Tokens; spend 300; unused 1,700 → refund equals the pro-rata amount based on the original AUD purchase price (minus fees).",
                "Unused Tokens (CAD/NZD): Same as above, but refund is in the original payment currency at the original amount paid.",
                "Opened Workout Plan: If you consented to immediate supply and downloaded the PDF, refunds apply only if defective or not as described (§4.2).",
                "Promotional Tokens: 100 bonus Tokens awarded in a promotion → non-refundable.",
                "Add-ons: Base 60 Tokens + add-on Token prices displayed before confirmation; once redeemed, non-refundable except under §4.2.",
            ],
        },
        {
            type: "text",
            title: "12. Contact Details",
            bullets: [
                "SHIREDON LIMITED",
                "Registered office: Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, United Kingdom, CF31 1JF",
                "Email: info@averis.co.uk",
                "Tel: +44 7441 393249",
                "Accepted currencies: AUD (A$), CAD (C$), NZD (NZ$)",
                "Payment methods: Visa, Mastercard",
            ],
        },
    ],
};

export default refundPolicySchema;
