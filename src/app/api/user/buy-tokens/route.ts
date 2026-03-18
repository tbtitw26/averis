import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import { userController } from "@/backend/controllers/user.controller";

const TOKENS_PER_GBP = 100;
const RATES_TO_GBP = {
    AUD: 2.04,
    CAD: 1.76,
    NZD: 2.22,
} as const;
const MIN_AMOUNT = 10;

type SupportedCurrency = keyof typeof RATES_TO_GBP;

export async function POST(req: NextRequest) {
    try {
        const payload = await requireAuth(req);
        const body = await req.json();

        if (body.currency && body.amount) {
            const { currency, amount } = body;
            if (!Object.keys(RATES_TO_GBP).includes(currency)) {
                return NextResponse.json({ message: "Unsupported currency" }, { status: 400 });
            }

            const amountNum = Number(amount);
            if (!Number.isFinite(amountNum) || amountNum <= 0) {
                return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
            }
            if (amountNum < MIN_AMOUNT) {
                return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
            }

            const gbpEquivalent = amountNum / RATES_TO_GBP[currency as SupportedCurrency];
            const tokens = Math.floor(gbpEquivalent * TOKENS_PER_GBP);

            // 🧾 запис транзакції вже всередині userController.buyTokens()
            const user = await userController.buyTokens(payload.sub, tokens);

            return NextResponse.json({ user, info: `Converted ${amount} ${currency} → ${tokens} tokens` });
        }

        const { amount } = body;
        if (!amount || amount <= 0) {
            return NextResponse.json({ message: "Invalid token amount" }, { status: 400 });
        }

        if (amount < MIN_AMOUNT * TOKENS_PER_GBP) {
            return NextResponse.json({ message: "Minimum is 10" }, { status: 400 });
        }

        const user = await userController.buyTokens(payload.sub, amount);
        return NextResponse.json({ user });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ message }, { status: 400 });
    }
}
