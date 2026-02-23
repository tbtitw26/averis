// app/api/spoynt/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { userController } from "@/backend/controllers/user.controller";

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

/**
 * Spoynt signature:
 * base64_encode( sha1( secret + rawJson + secret, true ) )
 * :contentReference[oaicite:9]{index=9}
 */
function spoyntSignature(secret: string, rawBody: string) {
    const sha1 = crypto.createHash("sha1");
    sha1.update(secret + rawBody + secret, "utf8");
    const digest = sha1.digest(); // binary
    return Buffer.from(digest).toString("base64");
}

export async function POST(req: NextRequest) {
    try {
        const secret = assertEnv("SPOYNT_PRIVATE_KEY");

        // Важливо: підпис рахується по RAW JSON :contentReference[oaicite:10]{index=10}
        const rawBody = await req.text();
        const theirSig =
            req.headers.get("x-signature") ||
            req.headers.get("X-Signature") ||
            "";

        if (!theirSig) {
            return NextResponse.json({ message: "Missing X-Signature" }, { status: 400 });
        }

        const ourSig = spoyntSignature(secret, rawBody);

        // constant-time compare
        const a = Buffer.from(ourSig);
        const b = Buffer.from(theirSig);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);

        const type = payload?.data?.type;
        const cpi = payload?.data?.id;
        const attrs = payload?.data?.attributes;

        if (type !== "payment-invoices" || !cpi) {
            return NextResponse.json({ message: "Unsupported callback type" }, { status: 200 });
        }

        const status = attrs?.status;         // наприклад processed :contentReference[oaicite:11]{index=11}
        const resolution = attrs?.resolution; // ok :contentReference[oaicite:12]{index=12}
        const metadata = attrs?.metadata || {};

        // 1) Ідемпотентність: не можна зарахувати двічі один cpi
        // TODO: перевірити в Mongo, чи cpi уже "credited".
        // if (await SpoyntPayment.exists({ cpi, credited: true })) return 200;

        if (status === "processed" && resolution === "ok") {
            const userId = metadata.user_id;
            const tokensStr = metadata.tokens;

            const tokens = Number(tokensStr);
            if (!userId || !Number.isFinite(tokens) || tokens <= 0) {
                return NextResponse.json({ message: "Missing metadata for crediting" }, { status: 200 });
            }

            // 2) Зарахування токенів тільки тут
            await userController.buyTokens(userId, Math.floor(tokens));

            // TODO: помітити транзакцію як credited: true (по cpi або reference_id)
            // await SpoyntPayment.updateOne({ cpi }, { $set: { credited: true, status, resolution } }, { upsert: true });

            return NextResponse.json({ ok: true });
        }

        // TODO: оновлювати статуси pending/failed в БД
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        // Вебхук краще не фейлити “жорстко”, але invalid signature треба відбивати.
        return NextResponse.json({ message: err?.message || "Webhook error" }, { status: 400 });
    }
}