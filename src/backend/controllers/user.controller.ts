import { connectDB } from "../config/db";
import { userService } from "../services/user.service";
import { UserType } from "@/backend/types/user.types";
import { transactionService } from "@/backend/services/transaction.service";
import { mapUserToUserType } from "@/backend/utils/user.mapper";
import { sendTransactionReceiptIfNeeded } from "@/backend/services/mail.service";

export const userController = {
    async buyTokens(userId: string, amount: number): Promise<UserType> {
        await connectDB();

        const user = await userService.addTokens(userId, amount);

        console.log("💳 Adding tokens for user:", userId);
        const transaction = await transactionService.record(user._id, user.email, amount, "add", user.tokens);
        console.log("✅ Transaction created successfully");

        await sendTransactionReceiptIfNeeded(transaction._id.toString(), {
            user,
            subject: "Token purchase confirmation",
            summary: "Your token purchase has been completed successfully.",
            amountLabel: "Tokens added",
            amountValue: `${amount} tokens`,
            details: [
                { label: "Transaction type", value: "Token purchase" },
                { label: "Balance after purchase", value: `${user.tokens} tokens` },
            ],
            transactionDate: transaction.createdAt,
            ctaPath: "/profile",
        });

        return mapUserToUserType(user);
    },

    async spendTokens(userId: string, amount: number, reason?: string): Promise<UserType> {
        await connectDB();

        const user = await userService.getUserById(userId);
        if (!user) throw new Error("User not found");
        if ((user.tokens || 0) < amount) throw new Error("Not enough tokens");

        user.tokens -= amount;
        await user.save();

        const transaction = await transactionService.record(user._id, user.email, amount, "spend", user.tokens);

        await sendTransactionReceiptIfNeeded(transaction._id.toString(), {
            user,
            subject: "Token usage confirmation",
            summary: `Your token deduction has been completed${reason ? ` for ${reason}` : ""}.`,
            amountLabel: "Tokens used",
            amountValue: `${amount} tokens`,
            details: [
                { label: "Transaction type", value: reason ? `Token usage for ${reason}` : "Token usage" },
                { label: "Balance after transaction", value: `${user.tokens} tokens` },
            ],
            transactionDate: transaction.createdAt,
            ctaPath: "/profile",
        });

        return mapUserToUserType(user);
    },
};
