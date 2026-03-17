import mongoose from "mongoose";
import { connectDB } from "@/backend/config/db";
import { SpoyntPayment } from "@/backend/models/spoyntPayment.model";
import { Transaction } from "@/backend/models/transaction.model";
import { User } from "@/backend/models/user.model";
import { sendEmail } from "@/backend/utils/sendEmail";
import { renderInvoicePdfBuffer } from "@/pdf-creator/InvoicePdf";

type SyncPaymentInput = {
    cpi: string;
    referenceId: string;
    userId: string;
    tokens: number;
    requestedCurrency: string;
    requestedAmount: number;
    chargedCurrency: string;
    chargedAmount: number;
    status: string;
    resolution?: string | null;
    providerUpdatedAt?: number | null;
};

type CreditResult =
    | { state: "credited"; tokens: number; balanceAfter: number; alreadyCredited: boolean }
    | { state: "pending" | "failed"; status: string; resolution: string | null }
    | { state: "invalid"; message: string };

function toObjectId(value: string) {
    return new mongoose.Types.ObjectId(value);
}

function isCreditEligible(status: string, resolution: string | null) {
    return status === "processed" && resolution === "ok";
}

export const spoyntService = {
    async upsertCreatedInvoice(input: SyncPaymentInput) {
        await connectDB();

        const existing = await SpoyntPayment.findOne({ cpi: input.cpi }).lean();

        if (!existing) {
            await SpoyntPayment.create({
                cpi: input.cpi,
                referenceId: input.referenceId,
                userId: toObjectId(input.userId),
                tokens: input.tokens,
                requestedCurrency: input.requestedCurrency,
                requestedAmount: input.requestedAmount,
                chargedCurrency: input.chargedCurrency,
                chargedAmount: input.chargedAmount,
                status: input.status,
                resolution: input.resolution ?? null,
                providerUpdatedAt: input.providerUpdatedAt ?? null,
                creditStatus: "not_credited",
                lastError: null,
            });
            return;
        }

        await SpoyntPayment.updateOne(
            { cpi: input.cpi },
            {
                $set: {
                    referenceId: input.referenceId,
                    tokens: input.tokens,
                    userId: toObjectId(input.userId),
                    requestedCurrency: input.requestedCurrency,
                    requestedAmount: input.requestedAmount,
                    chargedCurrency: input.chargedCurrency,
                    chargedAmount: input.chargedAmount,
                    status: input.status,
                    resolution: input.resolution ?? null,
                    providerUpdatedAt: input.providerUpdatedAt ?? null,
                    lastError: null,
                },
            }
        );
    },

    async processInvoice(input: SyncPaymentInput): Promise<CreditResult> {
        await connectDB();

        const existing = await SpoyntPayment.findOne({ cpi: input.cpi }).lean();
        const incomingUpdated = input.providerUpdatedAt ?? null;
        const currentUpdated = existing?.providerUpdatedAt ?? null;

        const isOutdated =
            incomingUpdated !== null &&
            currentUpdated !== null &&
            incomingUpdated < currentUpdated;

        const effectiveStatus = isOutdated ? existing?.status || input.status : input.status;
        const effectiveResolution = isOutdated
            ? existing?.resolution ?? input.resolution ?? null
            : input.resolution ?? null;
        const effectiveUpdated = isOutdated ? currentUpdated : incomingUpdated;

        const userId = existing?.userId?.toString() || input.userId;
        const tokens = existing?.tokens ?? input.tokens;
        const referenceId = existing?.referenceId || input.referenceId;
        const requestedCurrency = existing?.requestedCurrency || input.requestedCurrency;
        const requestedAmount = existing?.requestedAmount ?? input.requestedAmount;
        const chargedCurrency = input.chargedCurrency ?? existing?.chargedCurrency ?? "";
        const chargedAmount = input.chargedAmount ?? existing?.chargedAmount ?? 0;

        if (!userId || !Number.isFinite(tokens) || tokens <= 0) {
            return { state: "invalid", message: "Payment metadata missing" };
        }

        if (!existing) {
            await SpoyntPayment.create({
                cpi: input.cpi,
                referenceId,
                userId: toObjectId(userId),
                tokens,
                requestedCurrency,
                requestedAmount,
                chargedCurrency,
                chargedAmount,
                status: effectiveStatus,
                resolution: effectiveResolution,
                providerUpdatedAt: effectiveUpdated,
                creditStatus: "not_credited",
            });
        } else {
            await SpoyntPayment.updateOne(
                { cpi: input.cpi },
                {
                    $set: {
                        referenceId,
                        userId: toObjectId(userId),
                        tokens,
                        requestedCurrency,
                        requestedAmount,
                        chargedCurrency,
                        chargedAmount,
                        status: effectiveStatus,
                        resolution: effectiveResolution,
                        providerUpdatedAt: effectiveUpdated,
                    },
                }
            );
        }

        if (!isCreditEligible(effectiveStatus, effectiveResolution)) {
            return {
                state: effectiveStatus === "created" || effectiveStatus.endsWith("pending") || effectiveStatus === "processing"
                    ? "pending"
                    : "failed",
                status: effectiveStatus,
                resolution: effectiveResolution,
            };
        }

        const staleLockBefore = new Date(Date.now() - 10 * 60 * 1000);
        const claimed = await SpoyntPayment.findOneAndUpdate(
            {
                cpi: input.cpi,
                $or: [
                    { creditStatus: { $exists: false } },
                    { creditStatus: "not_credited" },
                    { creditStatus: "credit_failed" },
                    {
                        creditStatus: "crediting",
                        $or: [{ creditLockedAt: null }, { creditLockedAt: { $lt: staleLockBefore } }],
                    },
                ],
            },
            {
                $set: {
                    creditStatus: "crediting",
                    creditLockedAt: new Date(),
                    lastError: null,
                    status: effectiveStatus,
                    resolution: effectiveResolution,
                    providerUpdatedAt: effectiveUpdated,
                },
            },
            { new: true }
        );

        if (!claimed) {
            const latest = await SpoyntPayment.findOne({ cpi: input.cpi }).lean();

            if (latest?.creditStatus === "credited") {
                const user = latest.userId ? await User.findById(latest.userId).lean() : null;
                return {
                    state: "credited",
                    tokens: latest.tokens,
                    balanceAfter: user?.tokens ?? 0,
                    alreadyCredited: true,
                };
            }

            return { state: "pending", status: effectiveStatus, resolution: effectiveResolution };
        }

        const session = await mongoose.startSession();

        try {
            let balanceAfter = 0;
            let email = "";
            let customerName = "";
            let paidAt = new Date();

            await session.withTransaction(async () => {
                const user = await User.findByIdAndUpdate(
                    userId,
                    { $inc: { tokens } },
                    { new: true, session, runValidators: false }
                );

                if (!user) throw new Error("UserNotFound");

                balanceAfter = user.tokens;
                email = user.email;
                customerName = user.name || user.email;
                paidAt = new Date();

                await Transaction.create(
                    [
                        {
                            userId: user._id,
                            email: user.email,
                            amount: tokens,
                            type: "add",
                            balanceAfter: user.tokens,
                        },
                    ],
                    { session }
                );

                await SpoyntPayment.updateOne(
                    { cpi: input.cpi },
                    {
                        $set: {
                            creditStatus: "credited",
                            creditedAt: new Date(),
                            creditLockedAt: null,
                            lastError: null,
                            status: effectiveStatus,
                            resolution: effectiveResolution,
                            providerUpdatedAt: effectiveUpdated,
                        },
                    },
                    { session }
                );

            });

            try {
                const invoiceBuffer = await renderInvoicePdfBuffer({
                    invoiceNumber: referenceId,
                    issueDate: paidAt,
                    paidDate: paidAt,
                    customerName,
                    customerEmail: email,
                    referenceId,
                    cpi: input.cpi,
                    tokens,
                    amount: chargedAmount,
                    currency: chargedCurrency,
                });

                await sendEmail(
                    email,
                    "Tokens Purchased",
                    `You have successfully purchased ${tokens} tokens. Your new balance is ${balanceAfter} tokens.`,
                    undefined,
                    [
                        {
                            filename: `invoice-${referenceId}.pdf`,
                            content: invoiceBuffer,
                            contentType: "application/pdf",
                        },
                    ]
                );
            } catch (emailError) {
                console.error("Invoice email delivery failed:", emailError);
            }

            return { state: "credited", tokens, balanceAfter, alreadyCredited: false };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";

            await SpoyntPayment.updateOne(
                { cpi: input.cpi },
                {
                    $set: {
                        creditStatus: "credit_failed",
                        creditLockedAt: null,
                        lastError: message,
                    },
                }
            );

            throw error;
        } finally {
            await session.endSession();
        }
    },

    async getPaymentByCpi(cpi: string) {
        await connectDB();
        return SpoyntPayment.findOne({ cpi }).lean();
    },

    async getPaymentByReference(referenceId: string) {
        await connectDB();
        return SpoyntPayment.findOne({ referenceId }).lean();
    },
};
