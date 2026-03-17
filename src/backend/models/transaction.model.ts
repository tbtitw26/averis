import mongoose, { Schema, Document } from "mongoose";

export interface TransactionDocument extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;
    amount: number;
    type: "add" | "spend";
    balanceAfter: number;
    receiptEmailSentAt?: Date | null;
    receiptEmailProcessing?: boolean;
    createdAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["add", "spend"], required: true },
    balanceAfter: { type: Number, required: true },
    receiptEmailSentAt: { type: Date, default: null },
    receiptEmailProcessing: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export const Transaction =
    mongoose.models.Transaction ||
    mongoose.model<TransactionDocument>("Transaction", transactionSchema);
