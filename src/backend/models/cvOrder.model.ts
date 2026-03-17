import mongoose, { Schema, Document } from "mongoose";

export interface CVOrderDocument extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;

    fullName: string;
    phone: string;
    photo?: string;

    cvStyle: "Classic" | "Modern" | "Creative";
    fontStyle: string;
    themeColor: string;

    industry: string;
    experienceLevel: string;
    summary: string;
    workExperience: string;
    education: string;
    skills: string;

    reviewType: "default" | "manager";
    extras: string[];
    totalTokens: number;

    response: string;
    extrasData: Record<string, string>;
    confirmationEmailSentAt?: Date | null;
    confirmationEmailProcessing?: boolean;

    status: "pending" | "ready";
    readyAt: Date;
    createdAt: Date;
}

const cvOrderSchema = new Schema<CVOrderDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        email: { type: String, required: true },

        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        photo: { type: String },

        cvStyle: { type: String, enum: ["Classic", "Modern", "Creative"], default: "Classic" },
        fontStyle: { type: String, default: "Default" },
        themeColor: { type: String, default: "Default" },

        industry: { type: String, required: true },
        experienceLevel: { type: String, required: true },
        summary: { type: String, required: true },
        workExperience: { type: String, required: true },
        education: { type: String, required: true },
        skills: { type: String, required: true },

        reviewType: { type: String, enum: ["default", "manager"], default: "default" },
        extras: [{ type: String }],
        totalTokens: { type: Number, required: true, default: 0 },
        response: { type: String, required: false, default: "" },
        extrasData: { type: Map, of: String, default: {} },
        confirmationEmailSentAt: { type: Date, default: null },
        confirmationEmailProcessing: { type: Boolean, default: false },

        status: { type: String, enum: ["pending", "ready"], default: "ready" },
        readyAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { strict: false } // дозволяє зберігати нові поля навіть якщо кешована схема
);

// 🧩 Прибираємо кешовану модель
if (mongoose.models.CVOrder) {
    delete mongoose.models.CVOrder;
}

// 🧠 Перетворення extrasData з Map у Object
cvOrderSchema.set("toJSON", {
    transform: (doc, ret) => {
        if (ret.extrasData instanceof Map) {
            ret.extrasData = Object.fromEntries(ret.extrasData);
        }
        return ret;
    },
});

// 🧠 Те саме для .toObject() (щоб API не повертало порожній об’єкт)
cvOrderSchema.set("toObject", {
    transform: (doc, ret) => {
        if (ret.extrasData instanceof Map) {
            ret.extrasData = Object.fromEntries(ret.extrasData);
        }
        return ret;
    },
});

export const CVOrder = mongoose.model<CVOrderDocument>("CVOrder", cvOrderSchema);
