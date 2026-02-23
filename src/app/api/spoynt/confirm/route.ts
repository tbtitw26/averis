import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/backend/middlewares/auth.middleware";
import { userController } from "@/backend/controllers/user.controller";

function assertEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function basicAuthHeader(username: string, password: string) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${token}`;
}

export async function GET(req: NextRequest) {
    try {
        const payload = await requireAuth(req);
        const cpi = new URL(req.url).searchParams.get("cpi");

        if (!cpi) return NextResponse.json({ message: "Missing cpi" }, { status: 400 });

        const SPOYNT_BASE_URL = assertEnv("SPOYNT_BASE_URL");
        const SPOYNT_ACCOUNT_ID = assertEnv("SPOYNT_ACCOUNT_ID");
        const SPOYNT_API_KEY = assertEnv("SPOYNT_API_KEY");

        // 1) OPTIONAL (але must-have у проді):
        // перевірити в БД, що цей cpi вже не credited -> тоді просто вернути credited
        // if (await SpoyntPayment.exists({ cpi, credited: true })) return NextResponse.json({ status:"credited", ... });

        // 2) Fetch invoice status from Spoynt (server-to-server)
        const url = `${SPOYNT_BASE_URL}/payment-invoices/${encodeURIComponent(cpi)}`;

        const r = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: basicAuthHeader(SPOYNT_ACCOUNT_ID, SPOYNT_API_KEY),
            },
            cache: "no-store",
        });

        const text = await r.text();
        if (!r.ok) {
            return NextResponse.json({ message: "Spoynt fetch failed", details: text }, { status: 502 });
        }

        const json = JSON.parse(text);
        const attrs = json?.data?.attributes;

        const status = attrs?.status;         // e.g. processed / pending / failed
        const resolution = attrs?.resolution; // e.g. ok
        const metadata = attrs?.metadata || {};

        // Захист: токени можна зарахувати тільки власнику платежу
        const userId = metadata.user_id;
        const tokens = Number(metadata.tokens);

        if (!userId || !Number.isFinite(tokens) || tokens <= 0) {
            return NextResponse.json({ message: "Invoice metadata missing" }, { status: 400 });
        }

        if (userId !== payload.sub) {
            return NextResponse.json({ message: "Not your payment" }, { status: 403 });
        }

        if (status === "processed" && resolution === "ok") {
            // 3) Ідемпотентність (обов’язково зроби через БД):
            // - якщо вже credited: true => не начисляти знову
            // - якщо ні => начислити, помітити credited: true

            const user = await userController.buyTokens(payload.sub, Math.floor(tokens));

            // TODO: записати credited=true для cpi в БД (щоб не було повторів)
            // await SpoyntPayment.updateOne({ cpi }, { $set: { credited:true, status, resolution } }, { upsert:true });

            return NextResponse.json({ status: "credited", tokens: Math.floor(tokens), user });
        }

        if (status === "pending" || status === "created") {
            return NextResponse.json({ status: "pending" });
        }

        return NextResponse.json({ status: "failed", message: "Payment not confirmed", spoynt: { status, resolution } });
    } catch (err: any) {
        return NextResponse.json({ message: err?.message || "Unknown error" }, { status: 400 });
    }
}