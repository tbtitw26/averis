import { PageSchema } from "@/components/constructor/page-render/types";

const termsSchema: PageSchema = {
    meta: {
        title: "Terms and Conditions – Averis",
        description:
            "Official Terms and Conditions for using Averis.co.uk – rules, payments, tokens, refunds, liability, and user rights.",
        keywords: [
            "terms and conditions",
            "averis",
            "tokens",
            "refunds",
            "workout plan",
            "AI fitness",
            "digital content",
        ],
        canonical: "/terms-and-conditions",
        ogImage: {
            title: "Averis – Terms and Conditions",
            description: "Full Terms and Conditions for Averis AI Workout Platform.",
            bg: "#ffffff",
            color: "#000000",
        },
    },

    blocks: [
        {
            type: "text",
            title: "Terms and Conditions",
            description:
                "Effective date: 18 October 2025\n\nThese Terms and Conditions govern your access to and use of averis.co.uk and related services provided by SHIREDON LIMITED.",
        },

        // ✅ CLEAN INTRO (NO 1.1 / 1.2)
        {
            type: "text",
            title: "1. Introduction",
            description:
                "These Terms and Conditions (“Terms”) govern your access to and use of averis.co.uk and all related services provided by SHIREDON LIMITED.",
            bullets: [
                "The Service is operated by SHIREDON LIMITED (company number 15799662, registered office: Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, United Kingdom, CF31 1JF).",
                "These Terms form a legally binding agreement between Averis and each person who uses the Service (“you”, “User”, “Customer”).",
                "By creating an account, purchasing Tokens, or generating any workout plan, course, or PDF through the Service, you confirm that you have read, understood, and agreed to these Terms.",
                "If you do not agree with these Terms, you must not use the Service.",
            ],
        },

        {
            type: "text",
            title: "2. Definitions",
            bullets: [
                "Account – your user profile on the Service.",
                "Tokens – our internal, prepaid digital credits that enable you to use specific features of the Service (e.g., plan generation, PDF export). Tokens are not cash, e-money, or financial instruments.",
                "Workout Plan / Plan – any personalised or template workout program, exercise schedule, recommendations, trackers, and any related digital content generated or supplied via the Service, including PDFs.",
                "Add-ons / Extras – optional paid features or modules (e.g., extended program duration, multiple goal variants, enriched analytics, nutrition companion module where available).",
                "Order – a confirmed transaction to purchase Tokens and/or to redeem Tokens for Services.",
                "Services – the Averis platform and its features including the fitness intake forms, AI-assisted plan generation, optional human-coach review (if available in your region/plan), PDF creation, and delivery of digital content.",
                "Checkout Currency – GBP (£) or EUR (€), as selected at checkout.",
            ],
        },

        {
            type: "text",
            title: "3. Eligibility & Account Registration",
            description:
                "You must be 18 years or older to use the Service. If you use the Service on behalf of a company or organisation, you confirm that you have authority to bind that entity.\n\nYou must provide accurate, current information and keep your credentials secure. You are responsible for all activity under your Account.\n\nNotify us immediately of any suspected unauthorised access or security incident at info@averis.co.uk.",
        },

        {
            type: "text",
            title: "4. Tokens",
            description:
                "Tokens prepay access to features of the Service and have no cash value. Tokens are non-transferable and may not be exchanged, traded, or resold.\n\nTokens are issued after successful card payment. The current rate is displayed at the time of purchase.\n\nIf a generation fails for technical reasons attributable to us, Tokens are restored automatically or via support.\n\nTokens do not expire unless otherwise stated; inactive accounts (24 months) may be archived.\n\nPromotional or bonus Tokens may be subject to additional rules shown at the time of offer.",
        },

        {
            type: "text",
            title: "5. Ordering, Payment & Checkout",
            description:
                "Accepted payment methods: Visa, Mastercard · Accepted currencies: GBP (£), EUR (€)\n\nOrders are subject to acceptance; we may refuse orders to prevent fraud or technical errors.\n\nBy paying, you confirm you are authorised to use the selected card.\n\nPlans and PDFs are delivered electronically; generation time varies by system load.",
        },

        {
            type: "text",
            title: "6. Delivery of Digital Content (Workout Plans, AI Outputs & Courses)",
            description:
                "The Service provides digital content only. No physical goods are shipped. Delivery occurs when the requested digital content (including AI-generated workout plans, personalised programs, online courses, PDFs, or other digital materials) is successfully generated or made available in your Account.\n\nOnce processing is complete, the digital content becomes available for viewing, access, or download in your Account. Re-downloading the same Output does not consume additional Tokens while it remains available.\n\nDigital content is delivered via your Account dashboard, secure download links, or email notifications depending on the Service type.\n\nAccess depends on successful processing, system availability, and your internet connection. If processing fails due to a technical issue attributable to us, we will attempt re-processing or restore the corresponding Tokens.\n\nIf you cannot access or download your digital content, contact info@averis.co.uk with your Order ID and details.",
        },

        {
            type: "text",
            title: "7. Cancellations, Refunds & Consumer Rights",
            description:
                "By starting a generation, you request immediate performance and acknowledge loss of the statutory right to cancel.\n\nUnused Token top-ups may be cancelled within 14 days of purchase if unused.\n\nUsed Tokens are non-refundable unless required by law.\n\nUnwarranted chargebacks may result in suspension or removal of equivalent Tokens.",
        },

        {
            type: "text",
            title: "8. Health, Fitness & Safety Disclaimer",
            description:
                "Averis provides AI-generated workout plans for informational purposes only and does not provide medical advice.\n\nConsult a healthcare professional before starting any exercise program.\n\nExercise carries risks; you accept these by using the Service.",
        },

        {
            type: "text",
            title: "9. Your Inputs & Acceptable Use",
            description:
                "You must provide lawful, truthful inputs and must not misuse the Service, attempt to reverse engineer it, scrape content, disrupt operations, or circumvent technical limits.",
        },

        {
            type: "text",
            title: "10. Intellectual Property & Licences",
            description:
                "The Service and its content are owned by Averis or its licensors.\n\nUpon valid redemption, you receive a personal, non-transferable licence to use your generated Plans and PDFs.\n\nYou retain rights to your inputs and grant Averis a limited licence to use anonymised data for service improvement.",
        },

        {
            type: "text",
            title: "11. Warranties & Disclaimers",
            description:
                "Except as expressly stated, the Service is provided “as is” and “as available.” No specific health or fitness outcome is guaranteed.",
        },

        {
            type: "text",
            title: "12. Limitation of Liability",
            description:
                "Nothing limits liability for death or injury caused by negligence or fraud.\n\nOur total liability in any 12-month period shall not exceed the total amount paid for Tokens or Services.\n\nWe are not liable for indirect or consequential losses.",
        },

        {
            type: "text",
            title: "13. Indemnity",
            description:
                "You agree to indemnify Averis and its staff against claims or damages arising from unlawful use of the Service or violation of these Terms.",
        },

        {
            type: "text",
            title: "14. Data Protection & Privacy",
            description:
                "We process personal data in accordance with UK GDPR and the Data Protection Act 2018.\n\nBy using the Service, you accept our Privacy Policy and acknowledge your data rights.",
        },

        {
            type: "text",
            title: "15. Third-Party Services & Links",
            description:
                "The Service may include links or integrations with third-party services. We are not responsible for their practices or content.",
        },

        {
            type: "text",
            title: "16. Suspension & Termination",
            description:
                "We may suspend or terminate access if you breach these Terms or create security or fraud risks.\n\nUpon termination, your licence to use the Service ceases.",
        },

        {
            type: "text",
            title: "17. Changes to the Service or Terms",
            description:
                "We may update these Terms for legal, technical, or business reasons. Continued use constitutes acceptance of updated Terms.",
        },

        {
            type: "text",
            title: "18. Notices",
            description:
                "Formal notices may be sent to info@averis.co.uk or to our registered office. We may contact you via email or in-app messages.",
        },

        {
            type: "text",
            title: "19. Governing Law & Jurisdiction",
            description:
                "These Terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, except where consumer law provides otherwise.",
        },

        {
            type: "text",
            title: "20. Miscellaneous",
            description:
                "If any provision is found invalid, the remaining provisions remain in effect.\n\nNo waiver is effective unless in writing.\n\nThese Terms constitute the entire agreement between you and Averis.",
        },

        {
            type: "text",
            title: "21. Contact Details",
            bullets: [
                "SHIREDON LIMITED",
                "Academy House, 11 Dunraven Place, Bridgend, Mid Glamorgan, United Kingdom, CF31 1JF",
                "Company number: 15799662",
                "Email: info@averis.co.uk",
                "Tel: +44 7441 393249",
            ],
        },
    ],
};

export default termsSchema;
