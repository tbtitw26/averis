import { connectDB } from "../config/db";
import { authService } from "../services/auth.service";
import { LogoutResponse } from "@/backend/types/auth.types";
import { UserType } from "@/backend/types/user.types";
import { mapUserToUserType } from "@/backend/utils/user.mapper";
import { RegistrationInput } from "@/shared/auth/registration";

export const authController = {
    async register(body: RegistrationInput) {
        await connectDB();
        const { user, accessToken, refreshToken } = await authService.register(body);
        return { user: mapUserToUserType(user), tokens: { accessToken, refreshToken } };
    },

    async login(body: { email: string; password: string }, userAgent?: string, ip?: string) {
        await connectDB();
        const { user, accessToken, refreshToken } = await authService.login(body.email, body.password, userAgent, ip);
        return { user: mapUserToUserType(user), tokens: { accessToken, refreshToken } };
    },

    async refresh(refreshJWT: string, userAgent?: string, ip?: string) {
        await connectDB();
        const { user, accessToken, refreshToken } = await authService.refresh(refreshJWT, userAgent, ip);
        return { user: mapUserToUserType(user), tokens: { accessToken, refreshToken } };
    },

    async me(userId: string): Promise<UserType> {
        await connectDB();
        const user = await authService.me(userId);
        return mapUserToUserType(user);
    },

    async logout(refreshJWT: string): Promise<LogoutResponse> {
        await connectDB();
        await authService.logout(refreshJWT);
        return { message: "Logged out successfully" };
    },

    async logoutAll(userId: string): Promise<LogoutResponse> {
        await connectDB();
        await authService.logoutAll(userId);
        return { message: "All sessions revoked" };
    },
};
