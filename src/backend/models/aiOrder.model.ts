import mongoose, { Schema, Document } from "mongoose";

export interface AiOrderDocument extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;
    prompt: string;
    response: string;
    tokensUsed: number;
    confirmationEmailSentAt?: Date | null;
    confirmationEmailProcessing?: boolean;
    createdAt: Date;
}

const aiOrderSchema = new Schema<AiOrderDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    tokensUsed: { type: Number, required: true, default: 0 },
    confirmationEmailSentAt: { type: Date, default: null },
    confirmationEmailProcessing: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const AiOrder =
    mongoose.models.AiOrder || mongoose.model<AiOrderDocument>("AiOrder", aiOrderSchema);
