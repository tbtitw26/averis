import mongoose, { Schema, Document } from "mongoose";

export interface UniversalOrderDocument extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;

    category: string; // e.g. "training", "cv", "marketing"
    fields: Record<string, any>;
    extras: string[];
    totalTokens: number;
    planType: "default" | "reviewed";
    language?: string;

    response: string;
    extrasData: Record<string, string>;
    confirmationEmailSentAt?: Date | null;
    confirmationEmailProcessing?: boolean;

    status: "pending" | "ready";
    readyAt: Date;
    createdAt: Date;
}

const universalOrderSchema = new Schema<UniversalOrderDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        email: { type: String, required: true },
        category: { type: String, default: "general" },

        fields: { type: Schema.Types.Mixed, default: {} },
        extras: [{ type: String }],
        totalTokens: { type: Number, required: true },
        planType: { type: String, enum: ["default", "reviewed"], default: "default" },

        // 🌍 необов’язкове поле
        language: { type: String, required: false, default: "English" },

        response: { type: String, default: "" },
        extrasData: { type: Map, of: String, default: {} },
        confirmationEmailSentAt: { type: Date, default: null },
        confirmationEmailProcessing: { type: Boolean, default: false },

        status: { type: String, enum: ["pending", "ready"], default: "ready" },
        readyAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
    },
    { strict: false }
);

universalOrderSchema.set("toJSON", {
    transform: (_, ret) => {
        if (ret.extrasData instanceof Map)
            ret.extrasData = Object.fromEntries(ret.extrasData);
        return ret;
    },
});

export const UniversalOrder =
    mongoose.models.UniversalOrder ||
    mongoose.model<UniversalOrderDocument>("UniversalOrder", universalOrderSchema);
