import mongoose, { Document, Schema } from "mongoose";

export interface SpoyntPaymentDocument extends Document {
    cpi: string;
    referenceId: string;
    userId: mongoose.Types.ObjectId;
    tokens: number;
    requestedCurrency: string;
    requestedAmount: number;
    chargedCurrency: string;
    chargedAmount: number;
    status: string;
    resolution: string | null;
    providerUpdatedAt: number | null;
    creditStatus: "not_credited" | "crediting" | "credited" | "credit_failed";
    creditLockedAt: Date | null;
    creditedAt: Date | null;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const spoyntPaymentSchema = new Schema<SpoyntPaymentDocument>(
    {
        cpi: { type: String, required: true, unique: true, index: true },
        referenceId: { type: String, required: true, unique: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        tokens: { type: Number, required: true },
        requestedCurrency: { type: String, required: true },
        requestedAmount: { type: Number, required: true },
        chargedCurrency: { type: String, required: true },
        chargedAmount: { type: Number, required: true },
        status: { type: String, required: true, default: "created" },
        resolution: { type: String, default: null },
        providerUpdatedAt: { type: Number, default: null },
        creditStatus: {
            type: String,
            enum: ["not_credited", "crediting", "credited", "credit_failed"],
            default: "not_credited",
            index: true,
        },
        creditLockedAt: { type: Date, default: null },
        creditedAt: { type: Date, default: null },
        lastError: { type: String, default: null },
    },
    { timestamps: true }
);

export const SpoyntPayment =
    mongoose.models.SpoyntPayment ||
    mongoose.model<SpoyntPaymentDocument>("SpoyntPayment", spoyntPaymentSchema);
