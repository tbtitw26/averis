import { PageSchema } from "@/components/constructor/page-render/types";
import { COMPANY_NAME } from "@/resources/constants";

const schema: PageSchema = {
    meta: {
        title: `Plans & Pricing — ${COMPANY_NAME}`,
        description: `Find the perfect training plan for your goals — from AI-generated programs to full 1-on-1 coaching with certified trainers.`,
        keywords: [
            `${COMPANY_NAME} pricing`,
            "fitness plans",
            "personal trainer cost",
            "AI workout plan",
            "nutrition coaching pricing",
            "training subscription",
        ],
        canonical: "/pricing",
        ogImage: {
            title: `${COMPANY_NAME} Plans`,
            description: "Choose your training or nutrition plan — tailored to your goals.",
            bg: "#0a2540",
            color: "#ffffff",
        },
    },

    blocks: [
        // 🔹 HERO INTRO
        {
            type: "custom",
            component: "HeroSection",
            title: "Choose Your Training Plan",
            highlight: "For Every Goal & Lifestyle",
            description: `Select between fully guided coaching, AI-assisted programs, or a flexible custom plan.  
Every option helps you train smarter, stay motivated, and see results faster.`,
            image: "image4",
            align: "right",
        },

        // 🔹 INFOBLOCK (short intro)
        {
            type: "custom",
            component: "InfoBlock",
            icon: "💪",
            title: "Simple, Transparent, and Effective",
            description: `All ${COMPANY_NAME} plans include access to your personal dashboard, progress tracking tools, and direct chat with your trainer.  
No hidden fees — just real transformation.`,
            align: "center",
        },

        // 🔹 PRICING GRID
        {
            type: "grid",
            columns: 4,
            gap: "2rem",
            cards: [
                {
                    type: "pricing",
                    variant: "starter",
                    title: "AI Starter Plan",
                    price: "€10",
                    tokens: 1000,
                    badgeTop: "AI-Generated",
                    description:
                        "Quick, affordable, and fully automated — get your workout instantly based on your fitness profile.",
                    features: [
                        "Instant AI workout generation",
                        "Basic progress tracking",
                        "Weekly adjustment suggestions",
                    ],
                    buttonText: "Try AI Plan",
                    buttonLink: "/checkout?plan=ai",
                },
                {
                    type: "pricing",
                    variant: "pro",
                    title: "Trainer Plan",
                    price: "€59",
                    tokens: 5900,
                    badgeTop: "Most Popular",
                    description:
                        "Work directly with a certified personal trainer for a truly personalized experience.",
                    features: [
                        "1-on-1 coaching with real trainer",
                        "Weekly plan adjustments",
                        "Chat & feedback access",
                        "24h response from your coach",
                    ],
                    buttonText: "Start Coaching",
                    buttonLink: "/checkout?plan=trainer",
                },
                {
                    type: "pricing",
                    variant: "premium",
                    title: "Full Coaching Pack",
                    price: "€99",
                    tokens: 9900,
                    badgeTop: "Complete Transformation",
                    description:
                        "Combine training, nutrition, and AI analytics for total lifestyle results.",
                    features: [
                        "Trainer + nutritionist plan",
                        "Personalized workout & meal schedule",
                        "Smart AI progress tracking",
                        "Priority support & plan review",
                    ],
                    buttonText: "Choose Full Pack",
                    buttonLink: "/checkout?plan=full",
                },
                {
                    type: "pricing",
                    variant: "custom",
                    title: "Custom Plan",
                    price: "dynamic",
                    tokens: 0,
                    badgeTop: "Flexible Option",
                    description:
                        "Build your own combination — choose training, nutrition, or AI assistance as you need.",
                    features: [
                        "Flexible token usage",
                        "Combine training & nutrition freely",
                        "Pay only for what you need",
                    ],
                    buttonText: "Customize Plan",
                    buttonLink: "/checkout?plan=custom",
                },
            ],
        },

        // 🔹 SECTION: WHY UPGRADE
        {
            type: "section",
            left: {
                type: "custom",
                component: "InfoBlock",
                title: "Why Upgrade to a Trainer?",
                description: `AI gives structure — but real trainers give insight, accountability, and emotional support.  
Your coach ensures every session, rest, and meal fits your body and your mindset.`,
                bullets: [
                    "Real-time feedback from certified professionals",
                    "Weekly plan updates based on your progress",
                    "Personal motivation and support",
                ],
            },
            right: {
                type: "media",
                mediaType: "image",
                src: "image14",
                alt: "Trainer helping client",
            },
        },

        // 🔹 NUTRITION ADDON SECTION
        {
            type: "custom",
            component: "MissionBanner",
            title: "Add Personalized Nutrition",
            description: `Fuel your workouts with meal plans created by certified nutritionists.  
Integrated calorie goals, daily recipes, and AI-based tracking for sustainable results.`,
            image: "nutritionBanner",
        },

        // 🔹 FAQ
        {
            type: "faq",
            items: [
                {
                    question: "What’s the difference between AI and Trainer Plans?",
                    answer:
                        "AI creates your program instantly using algorithms. Trainer plans are built by certified professionals who adapt it weekly and provide human feedback.",
                },
                {
                    question: "Do plans include nutrition?",
                    answer:
                        "Only the Full Coaching Pack or a Custom Plan with Nutrition Add-On includes meal guidance. You can add it anytime.",
                },
                {
                    question: "Can I switch plans later?",
                    answer:
                        "Yes, you can upgrade, downgrade, or combine services at any time using your tokens.",
                },
                {
                    question: "What do I need to start?",
                    answer:
                        "Just create an account, fill out your fitness profile, and select your preferred plan. You’ll receive your program within 24h.",
                },
            ],
        },

        // 🔹 FINAL CTA
        {
            type: "custom",
            component: "MissionBanner",
            title: "Ready to Transform?",
            description: `Join ${COMPANY_NAME} today and start your personalized fitness journey.  
Get your plan, stay consistent, and achieve lasting results.`,
            image: "ctaPricing",
        },
    ],
};

export default schema;
