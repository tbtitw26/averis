import { User } from "../models/user.model";

export const userService = {
    async addTokens(userId: string, amount: number) {
        const updated = await User.findByIdAndUpdate(
            userId,
            { $inc: { tokens: amount } },
            { new: true, runValidators: false }
        );
        if (!updated) throw new Error("UserNotFound");
        return updated;
    },

    async getUserById(userId: string) {
        const user = await User.findById(userId);
        if (!user) throw new Error("UserNotFound");
        return user;
    },
};
