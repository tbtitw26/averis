import { AiOrder } from "../models/aiOrder.model";
import { User } from "../models/user.model";
import { ENV } from "../config/env";
import OpenAI from "openai";
import { transactionService } from "../services/transaction.service";
import { sendOrderConfirmationIfNeeded } from "@/backend/services/mail.service";

const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });

const LENGTH_MAP: Record<string, { chunks: number }> = {
    "Short (1 page)": { chunks: 1 },
    "Medium (2–3 pages)": { chunks: 1 },
    "Detailed (5+ pages)": { chunks: 3 },
};


export const aiService = {
    async processPrompt(userId: string, email: string, prompt: string, cost?: number) {
        const user = await User.findById(userId);
        if (!user) throw new Error("UserNotFound");

        const finalCost = cost ?? parseInt(ENV.AI_COST_PER_REQUEST || "30", 10);
        if (user.tokens < finalCost) throw new Error("InsufficientTokens");

        user.tokens -= finalCost;
        await user.save();
        await transactionService.record(user._id, user.email, finalCost, "spend", user.tokens);

        let chunksCount = 1;
        for (const key in LENGTH_MAP) {
            if (prompt.includes(key)) {
                chunksCount = LENGTH_MAP[key].chunks;
                break;
            }
        }

        let polishedText = "";
        try {
            for (let i = 1; i <= chunksCount; i++) {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: `${prompt}\n\nContinue writing Section ${i}. Keep the style consistent and natural.`,
                        },
                    ],
                });

                polishedText += "\n\n" + (completion.choices[0].message?.content || "");
            }
        } catch (err: any) {
            throw new Error("OpenAIError: " + err.message);
        }

        const order = await AiOrder.create({
            userId,
            email,
            prompt,
            response: polishedText.trim(),
            tokensUsed: finalCost,
        });

        await sendOrderConfirmationIfNeeded(AiOrder, order._id.toString(), {
            user,
            subject: "AI order confirmation",
            summary: "Your AI order has been completed successfully.",
            amountLabel: "Tokens used",
            amountValue: `${finalCost} tokens`,
            details: [
                { label: "Service", value: "AI prompt generation" },
                { label: "Prompt preview", value: prompt.slice(0, 120) || "Custom prompt" },
                { label: "Order ID", value: order._id.toString() },
            ],
            transactionDate: order.createdAt,
            ctaPath: "/profile",
        });

        return order;
    },

    async getOrders(userId: string) {
        return AiOrder.find({ userId }).sort({ createdAt: -1 });
    },

    async getOrderById(userId: string, orderId: string) {
        return AiOrder.findOne({ _id: orderId, userId });
    },
};
