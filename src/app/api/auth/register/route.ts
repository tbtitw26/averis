import { NextRequest, NextResponse } from "next/server";
import { authController } from "@/backend/controllers/auth.controller";
import { attachAuthCookies } from "@/backend/utils/cookies";
import { registrationGuard } from "@/backend/utils/registrationGuard";

export async function POST(req: NextRequest) {
    try {
        const blocked = await registrationGuard(req);
        if (blocked) return blocked;

        const body = await req.json();
        const { user, tokens } = await authController.register(body);
        const res = NextResponse.json({ user }, { status: 200 });
        attachAuthCookies(res, tokens.accessToken, tokens.refreshToken, 60 * 60 * 24 * 30);
        return res;
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Registration error";
        const knownMessages = [
            "registered",
            "required",
            "valid",
            "match",
        ];
        const code = knownMessages.some((part) =>
            msg.toLowerCase().includes(part)
        )
            ? 400
            : 500;
        return NextResponse.json({ type: "EmailAlreadyRegistered", message: msg }, { status: code });
    }
}
