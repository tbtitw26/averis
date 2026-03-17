import { connectDB } from "../config/db";
import { UniversalOrder, UniversalOrderDocument } from "../models/universalOrder.model";
import { User } from "../models/user.model";
import { transactionService } from "../services/transaction.service";
import OpenAI from "openai";
import { ENV } from "../config/env";
import mongoose from "mongoose";
import { sendOrderConfirmationIfNeeded } from "@/backend/services/mail.service";

const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });

/** 🧩 Universal main prompt builder */
function buildPrompt(body: any): string {
    const { category, fields, planType } = body;
    const jsonData = JSON.stringify(fields, null, 2);
    const languageNote = body.language
        ? `Write the entire output in ${body.language}.`
        : "Write in English.";

    switch (category) {
        case "training":
            return planType === "reviewed"
                ? `
You are a certified human performance coach.
Design a **comprehensive and highly detailed ${fields.days || 7}-day training plan**.

## Client Data
${jsonData}

## Instructions:
- Write in clear, structured language, sectioned by day.
- Include warm-ups, exercises, rest, motivation, and explanations.
- Tone: professional and encouraging.
- ${languageNote}
`
                : `
You are a virtual fitness assistant.
Generate a **concise ${fields.days || 7}-day workout plan**.

Client info:
${jsonData}

Focus on: Day, Focus, Exercises, Tip.
Tone: energetic and friendly.
${languageNote}
`;

        case "nutrition":
            return planType === "reviewed"
                ? `
You are a certified nutritionist.
Create a **detailed daily meal plan** with calories, macros, and hydration.

User info:
${jsonData}

Include explanations and adaptation tips.
${languageNote}
`
                : `
You are an AI diet assistant.
Generate a short nutrition overview for:
${jsonData}
Include daily focus, example meals, and hydration note.
${languageNote}
`;

        default:
            return planType === "reviewed"
                ? `
You are a senior content creator.
Produce a **comprehensive, structured response** with expert depth.

Context:
${jsonData}
${languageNote}
`
                : `
You are an AI assistant.
Generate a **concise version** of the requested content:
${jsonData}
${languageNote}
`;
    }
}

/** 🧩 Extra section prompt builder */
function buildExtraPrompt(extra: string, category: string, fields: any, language?: string): string {
    const context = JSON.stringify(fields, null, 2);
    const langNote = language ? `Write in ${language}.` : "";
    switch (extra) {
        case "progressTracking":
            return `Create a weekly progress tracking table for ${category}.\n${langNote}\n${context}`;
        case "motivationTips":
            return `Write 10 motivational phrases related to this ${category} context.\n${langNote}\n${context}`;
        case "summaryReport":
            return `Write a short summary report showing how the plan achieves goals.\n${langNote}\n${context}`;
        default:
            return `Generate a useful ${extra} section.\n${langNote}\n${context}`;
    }
}

export const universalService = {
    /** 🧩 Створення нового універсального замовлення */
    async createOrder(userId: string, email: string, body: any) {
        await connectDB();

        console.log("📦 [createOrder] incoming body:", JSON.stringify(body, null, 2));

        // ✅ Валідація
        if (!body || typeof body !== "object") throw new Error("Invalid request body");
        if (!body.category) throw new Error("Missing category");
        if (!body.fields || typeof body.fields !== "object") throw new Error("Missing fields");
        if (!body.totalTokens || isNaN(body.totalTokens)) throw new Error("Invalid totalTokens value");

        if (body.planType === "instant") body.planType = "default";
        if (!["default", "reviewed"].includes(body.planType))
            throw new Error("Invalid planType (must be 'default' or 'reviewed')");

        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const languageCost = body.language && body.language !== "English" ? 5 : 0;
        const totalCost = Number(body.totalTokens) + languageCost;
        console.log(`💰 [Token check] user has ${user.tokens}, required ${totalCost}`);

        if (user.tokens < totalCost)
            throw new Error(`Insufficient tokens (have ${user.tokens}, need ${totalCost})`);

        // 💳 Знімаємо токени
        user.tokens -= totalCost;
        await user.save();
        await transactionService.record(user._id, email, totalCost, "spend", user.tokens);
        console.log("🧾 Transaction recorded successfully");

        // 🧠 Генерація основного контенту
        const mainPrompt = buildPrompt(body);
        console.log("🧠 Main prompt ready");

        let mainText = "";
        try {
            const mainRes = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are a structured professional generator. Always output final readable content.",
                    },
                    { role: "user", content: mainPrompt },
                ],
            });

            mainText = mainRes.choices?.[0]?.message?.content?.trim() || "";
        } catch (err: any) {
            console.error("❌ OpenAI generation failed:", err.message);
            throw new Error("AI generation failed, please retry later");
        }

        // 🎯 Генерація додаткових секцій
        const extrasData: Record<string, string> = {};
        if (Array.isArray(body.extras) && body.extras.length > 0) {
            console.log("✨ Generating extras:", body.extras);
            for (const extra of body.extras) {
                try {
                    const extraPrompt = buildExtraPrompt(extra, body.category, body.fields, body.language);
                    const extraRes = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: extraPrompt }],
                    });
                    extrasData[extra] = extraRes.choices?.[0]?.message?.content?.trim() || "";
                } catch (err: any) {
                    console.error("❌ Error generating extra:", extra, err.message);
                }
            }
        }

        const readyAt =
            body.planType === "reviewed"
                ? new Date(Date.now() + 24 * 60 * 60 * 1000)
                : new Date();

        // 🗂️ Збереження замовлення
        const orderDoc = {
            userId: new mongoose.Types.ObjectId(userId),
            email,
            category: body.category,
            fields: body.fields,
            planType: body.planType,
            extras: body.extras || [],
            totalTokens: totalCost,
            language: body.language || "English",
            response: mainText,
            extrasData,
            status: body.planType === "reviewed" ? "pending" : "ready",
            readyAt,
        };

        const order = await UniversalOrder.create(orderDoc);
        console.log("✅ Order saved successfully:", order._id);

        await sendOrderConfirmationIfNeeded(UniversalOrder, order._id.toString(), {
            user,
            subject: "Order confirmation",
            summary: "Your order has been completed successfully.",
            amountLabel: "Tokens used",
            amountValue: `${totalCost} tokens`,
            details: [
                { label: "Category", value: body.category },
                { label: "Plan type", value: body.planType },
                { label: "Language", value: body.language || "English" },
                { label: "Order ID", value: order._id.toString() },
            ],
            transactionDate: order.createdAt,
            ctaPath: "/profile",
        });

        return order.toObject({ flattenMaps: true });
    },

    /** 🧩 Отримання всіх замовлень користувача */
    async getOrders(userId: string) {
        await connectDB();

        const docs = await UniversalOrder.find({ userId })
            .sort({ createdAt: -1 })
            .lean<UniversalOrderDocument[]>({ virtuals: true });

        // 🧩 Конвертація Map → Object
        return docs.map((d: any) => {
            if (d.extrasData instanceof Map)
                d.extrasData = Object.fromEntries(d.extrasData);
            return d;
        });
    },

    /** 🧩 Отримання одного замовлення */
    async getOrderById(userId: string, orderId: string) {
        await connectDB();

        const doc = await UniversalOrder.findOne({ _id: orderId, userId })
            .lean<UniversalOrderDocument>({ virtuals: true });

        if (!doc) return null;

        if (doc.extrasData instanceof Map)
            doc.extrasData = Object.fromEntries(doc.extrasData);

        return doc;
    },
};
