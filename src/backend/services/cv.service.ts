import { CVOrder } from "../models/cvOrder.model";
import { User } from "../models/user.model";
import { ENV } from "../config/env";
import OpenAI from "openai";
import { CVOrderType } from "../types/cv.types";
import mongoose from "mongoose";
import { transactionService } from "../services/transaction.service";
import { sendOrderConfirmationIfNeeded } from "@/backend/services/mail.service";

const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });

const log = (fn: string, msg: string, data?: any) => {
    const time = new Date().toISOString();
    console.log(`[${time}] 🧩 [cvService.${fn}] ${msg}`, data ?? "");
};

// ---------- BASE PROMPTS ----------
const buildSimplePrompt = (b: any, email: string) => `
Create a concise, professional CV in English.
Include sections: Summary, Work Experience, Education, Skills.

Name: ${b.fullName}
Email: ${email}
Phone: ${b.phone}
Industry: ${b.industry}
Experience Level: ${b.experienceLevel}

Summary: ${b.summary}
Work Experience: ${b.workExperience}
Education: ${b.education}
Skills: ${b.skills}
`;

const buildDetailedPrompt = (b: any, email: string) => `
Create a detailed recruiter-friendly CV in English.
Include sections: Summary, Key Achievements, Work Experience, Education, Skills, Languages, and Professional Impact.

Name: ${b.fullName}
Email: ${email}
Phone: ${b.phone}
Industry: ${b.industry}
Experience Level: ${b.experienceLevel}

Summary: ${b.summary}
Work Experience: ${b.workExperience}
Education: ${b.education}
Skills: ${b.skills}
`;

// ---------- EXTRA PROMPTS ----------
const buildExtraPrompts = {
    coverLetter: (b: any) => `
You are a professional HR copywriter. Write a fully finished, one-page cover letter for ${b.fullName}, applying for a ${b.industry} role. 
Use a professional tone and include motivation, key achievements, and career goals. 
Do not ask any questions — output only the final letter.

Summary: ${b.summary}
Experience: ${b.workExperience}
Education: ${b.education}
Skills: ${b.skills}
`,

    linkedin: (b: any) => `
You are a LinkedIn optimization expert. Write a complete and ready-to-publish "About" section for ${b.fullName}, 
a ${b.experienceLevel} professional in ${b.industry}. 
Focus on strengths, leadership, and career achievements. 
Do not ask questions — return only the finished text.
`,

    keywords: (b: any) => `
List exactly 20 high-impact, comma-separated keywords recruiters use for ${b.industry} (${b.experienceLevel}) positions. 
Focus on hard and soft skills, tools, and industry terminology. Return only the list.
`,

    atsCheck: (b: any) => `
Write a brief ATS (Applicant Tracking System) compatibility report for this CV. 
Describe keyword optimization, formatting quality, and recruiter readability in plain English. 
Return a concise, ready-to-read report — no explanations or questions.
`,

    jobAdaptation: (b: any) => `
You are a senior recruiter adapting a CV for a ${b.industry} job. 
Rewrite the Summary and Work Experience sections to align perfectly with recruiter expectations. 
Return only the adapted, finished text — do not request more info or clarification.

Summary: ${b.summary}
Work Experience: ${b.workExperience}
Education: ${b.education}
Skills: ${b.skills}
`,

    achievements: (b: any) => `
Generate exactly 5 measurable and resume-ready achievements for a ${b.experienceLevel} ${b.industry} specialist. 
Each achievement should use a strong action verb and a quantifiable outcome. 
Return only the bullet list, no commentary.
`,

    skillsGap: (b: any) => `
Write a short "Skills Gap Analysis" report for a ${b.experienceLevel} ${b.industry} professional. 
Identify 5 missing but valuable skills and recommend 3 courses or learning paths to close these gaps. 
Output only the report text.
`,
};

// ---------- SERVICE ----------
export const cvService = {
    async createOrder(userId: string, email: string, body: any): Promise<CVOrderType> {
        log("createOrder", "Start", { userId, email, reviewType: body.reviewType });

        const user = await User.findById(userId);
        if (!user) throw new Error("UserNotFound");

        const BASE_COST: Record<string, number> = { default: 30, manager: 60 };
        const EXTRA_COST: Record<string, number> = {
            coverLetter: 10,
            linkedin: 15,
            keywords: 12,
            atsCheck: 12,
            jobAdaptation: 20,
            achievements: 10,
            skillsGap: 15,
            customFont: 5,
            customColor: 5,
        };

        const baseCost = BASE_COST[body.reviewType] ?? 30;
        const extrasCost = (body.extras || []).reduce(
            (sum: number, key: string) => sum + (EXTRA_COST[key] || 0),
            0
        );
        const totalCost = baseCost + extrasCost;

        // 🧾 Перевірка балансу
        if (user.tokens < totalCost) throw new Error("InsufficientTokens");

        // 💳 Списуємо токени та записуємо транзакцію
        user.tokens -= totalCost;
        await user.save();

        await transactionService.record(
            user._id,
            user.email,
            totalCost,
            "spend",
            user.tokens
        );

        log("createOrder", `💸 Tokens spent & transaction recorded`, {
            totalCost,
            balanceAfter: user.tokens,
        });

        // 🧠 Генерація CV
        const isManager = body.reviewType === "manager";
        const mainPrompt = isManager
            ? buildDetailedPrompt(body, email)
            : buildSimplePrompt(body, email);

        const mainRes = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a professional HR CV generator. Always return a finished, well-formatted CV text. Never ask clarifying questions.",
                },
                { role: "user", content: mainPrompt },
            ],
        });
        const mainText = mainRes.choices[0].message?.content || "";

        // ✨ Генерація extras
        const extrasData: Record<string, string> = {};
        for (const extra of body.extras || []) {
            const fn = buildExtraPrompts[extra as keyof typeof buildExtraPrompts];
            if (!fn) continue;
            try {
                const extraRes = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a professional HR assistant. Always provide the final polished text, without asking for more details or context.",
                        },
                        { role: "user", content: fn(body) },
                    ],
                });
                extrasData[extra] = extraRes.choices[0].message?.content || "";
                log("createOrder", `✅ Extra generated: ${extra}`);
            } catch (err: any) {
                log("createOrder", `❌ Error generating extra: ${extra}`, err.message);
            }
        }

        const readyAt = isManager
            ? new Date(Date.now() + 60 * 1000) // тест — 1 хв
            : new Date();

        // 💾 Створюємо CVOrder
        const orderDoc = await CVOrder.create({
            userId: new mongoose.Types.ObjectId(userId),
            email,
            ...body,
            totalTokens: totalCost,
            response: mainText,
            extrasData,
            status: isManager ? "pending" : "ready",
            readyAt,
        });

        const order = orderDoc.toObject() as CVOrderType;
        await sendOrderConfirmationIfNeeded(CVOrder, orderDoc._id.toString(), {
            user,
            subject: "CV order confirmation",
            summary: "Your CV order has been received successfully.",
            amountLabel: "Tokens used",
            amountValue: `${totalCost} tokens`,
            details: [
                { label: "Service", value: `CV review (${body.reviewType})` },
                { label: "Extras", value: Array.isArray(body.extras) && body.extras.length > 0 ? body.extras.join(", ") : "None" },
                { label: "Order ID", value: orderDoc._id.toString() },
            ],
            transactionDate: orderDoc.createdAt,
            ctaPath: "/profile",
        });
        log("createOrder", "✅ Completed", { id: order._id, extrasKeys: Object.keys(extrasData) });

        return order;
    },

    async getOrders(userId: string): Promise<CVOrderType[]> {
        const docs = await CVOrder.find({ userId }).sort({ createdAt: -1 });
        return docs.map((d) => d.toObject() as CVOrderType);
    },

    async getOrderById(userId: string, orderId: string): Promise<CVOrderType | null> {
        const doc = await CVOrder.findOne({ _id: orderId, userId });
        return doc ? (doc.toObject() as CVOrderType) : null;
    },
};
