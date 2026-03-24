import { Model } from "mongoose";
import { ENV } from "@/backend/config/env";
import { sendEmail } from "@/backend/utils/sendEmail";
import { Transaction } from "@/backend/models/transaction.model";

type EmailDetail = {
    label: string;
    value: string;
};

type ConfirmationPayload = {
    user: {
        email: string;
        firstName?: string | null;
        name?: string | null;
    };
    subject: string;
    summary: string;
    amountLabel: string;
    amountValue: string;
    details: EmailDetail[];
    transactionDate?: Date;
    ctaPath?: string;
};

function getRecipientName(user: ConfirmationPayload["user"]) {
    return user.firstName || user.name || "there";
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildConfirmationHtml(payload: ConfirmationPayload) {
    const recipientName = escapeHtml(getRecipientName(payload.user));
    const transactionDate = (payload.transactionDate || new Date()).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const detailsHtml = payload.details
        .map(
            (detail) => `
                <tr>
                    <td style="padding:8px 0;color:#64748b;font-size:14px;">${escapeHtml(detail.label)}</td>
                    <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(detail.value)}</td>
                </tr>
            `
        )
        .join("");

    const ctaUrl = `${ENV.APP_URL}${payload.ctaPath || "/profile"}`;

    return `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
            <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
                <h2 style="margin:0 0 16px;font-size:24px;color:#0f172a;">${escapeHtml(payload.subject)}</h2>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Hi ${recipientName},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(payload.summary)}</p>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px;">
                    <div style="font-size:13px;color:#1d4ed8;text-transform:uppercase;font-weight:700;letter-spacing:0.04em;">${escapeHtml(payload.amountLabel)}</div>
                    <div style="font-size:24px;color:#1e3a8a;font-weight:800;margin-top:6px;">${escapeHtml(payload.amountValue)}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                    <tbody>${detailsHtml}</tbody>
                </table>
                <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Transaction date: ${transactionDate}</p>
                <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">
                    View your account
                </a>
            </div>
        </div>
    `;
}

function buildConfirmationText(payload: ConfirmationPayload) {
    const transactionDate = (payload.transactionDate || new Date()).toLocaleString("en-US");
    return [
        `Hi ${getRecipientName(payload.user)},`,
        "",
        payload.summary,
        "",
        `${payload.amountLabel}: ${payload.amountValue}`,
        ...payload.details.map((detail) => `${detail.label}: ${detail.value}`),
        `Transaction date: ${transactionDate}`,
    ].join("\n");
}

function buildWelcomeHtml(user: {
    email: string;
    firstName?: string | null;
    name?: string | null;
}) {
    const recipientName = escapeHtml(getRecipientName(user));
    const pricingUrl = `${ENV.APP_URL}/pricing`;
    const profileUrl = `${ENV.APP_URL}/profile`;
    const year = new Date().getFullYear();

    return `
        <div style="margin:0;padding:32px 16px;background:#eef6f3;font-family:Arial,sans-serif;color:#10231c;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeae3;box-shadow:0 18px 48px rgba(16,35,28,0.08);">
                <div style="padding:40px 40px 28px;background:linear-gradient(135deg,#0f3d2e 0%,#1f7a5a 100%);color:#ffffff;">
                    <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.14);font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                        Welcome to Averis
                    </div>
                    <h1 style="margin:18px 0 12px;font-size:34px;line-height:1.15;font-weight:800;color:#ffffff;">
                        Your account is ready, ${recipientName}.
                    </h1>
                    <p style="margin:0;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.86);max-width:520px;">
                        Registration completed successfully. You can now access your profile, choose a plan, and start your first order.
                    </p>
                </div>

                <div style="padding:32px 40px;">
                    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:28px;">
                        <div style="padding:18px;border-radius:18px;background:#f6fbf9;border:1px solid #dcebe4;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5b7a6d;margin-bottom:8px;">
                                Account status
                            </div>
                            <div style="font-size:26px;font-weight:800;color:#0f3d2e;">Active</div>
                        </div>
                        <div style="padding:18px;border-radius:18px;background:#f6fbf9;border:1px solid #dcebe4;">
                            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5b7a6d;margin-bottom:8px;">
                                Registered email
                            </div>
                            <div style="font-size:18px;font-weight:700;color:#0f172a;word-break:break-word;">${escapeHtml(user.email)}</div>
                        </div>
                    </div>

                    <div style="padding:22px 24px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:28px;">
                        <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:14px;">What you can do next</div>
                        <div style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                            1. Complete your profile details.
                        </div>
                        <div style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
                            2. Choose the plan or token amount that fits you.
                        </div>
                        <div style="margin:0;font-size:15px;line-height:1.7;color:#334155;">
                            3. Start your first order and manage it from your account.
                        </div>
                    </div>

                    <div style="margin-bottom:28px;">
                        <a href="${profileUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#0f3d2e;color:#ffffff;text-decoration:none;font-weight:800;margin-right:12px;">
                            Open Profile
                        </a>
                        <a href="${pricingUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#edf7f2;color:#0f3d2e;text-decoration:none;font-weight:800;border:1px solid #cfe4d9;">
                            View Pricing
                        </a>
                    </div>

                    <div style="padding-top:22px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
                        If this registration was not made by you, please contact support as soon as possible.
                    </div>
                </div>

                <div style="padding:18px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                    © ${year} Averis. Your account has been created successfully.
                </div>
            </div>
        </div>
    `;
}

function buildWelcomeText(user: {
    email: string;
    firstName?: string | null;
    name?: string | null;
}) {
    const recipientName = getRecipientName(user);

    return [
        `Hi ${recipientName},`,
        "",
        "Welcome to Averis.",
        "Your account has been created successfully and is now active.",
        "",
        `Registered email: ${user.email}`,
        `Profile: ${ENV.APP_URL}/profile`,
        `Pricing: ${ENV.APP_URL}/pricing`,
        "",
        "Next steps:",
        "1. Complete your profile details.",
        "2. Choose a plan or token amount.",
        "3. Start your first order.",
    ].join("\n");
}

async function deliverConfirmationEmail(payload: ConfirmationPayload) {
    try {
        await sendEmail(
            payload.user.email,
            payload.subject,
            buildConfirmationText(payload),
            buildConfirmationHtml(payload)
        );
        return true;
    } catch (error) {
        console.error("Confirmation email failed:", error);
        return false;
    }
}

export async function sendWelcomeEmail(user: {
    email: string;
    firstName?: string | null;
    name?: string | null;
}) {
    try {
        await sendEmail(
            user.email,
            "Welcome to Averis",
            buildWelcomeText(user),
            buildWelcomeHtml(user)
        );
    } catch (error) {
        console.error("Welcome email failed:", error);
    }
}

export async function sendTransactionReceiptIfNeeded(
    transactionId: string,
    payload: ConfirmationPayload
) {
    const reserved = await Transaction.findOneAndUpdate(
        {
            _id: transactionId,
            $and: [
                {
                    $or: [
                        { receiptEmailSentAt: null },
                        { receiptEmailSentAt: { $exists: false } },
                    ],
                },
                {
                    $or: [
                        { receiptEmailProcessing: false },
                        { receiptEmailProcessing: { $exists: false } },
                    ],
                },
            ],
        },
        { $set: { receiptEmailProcessing: true } },
        { new: true }
    );

    if (!reserved) return false;

    const sent = await deliverConfirmationEmail(payload);
    await Transaction.findByIdAndUpdate(transactionId, {
        $set: {
            receiptEmailProcessing: false,
            ...(sent ? { receiptEmailSentAt: new Date() } : {}),
        },
    });

    return sent;
}

export async function sendOrderConfirmationIfNeeded(
    model: Model<unknown>,
    orderId: string,
    payload: ConfirmationPayload
) {
    const reserved = await model.findOneAndUpdate(
        {
            _id: orderId,
            $and: [
                {
                    $or: [
                        { confirmationEmailSentAt: null },
                        { confirmationEmailSentAt: { $exists: false } },
                    ],
                },
                {
                    $or: [
                        { confirmationEmailProcessing: false },
                        { confirmationEmailProcessing: { $exists: false } },
                    ],
                },
            ],
        },
        { $set: { confirmationEmailProcessing: true } },
        { new: true }
    );

    if (!reserved) return false;

    const sent = await deliverConfirmationEmail(payload);
    await model.findByIdAndUpdate(orderId, {
        $set: {
            confirmationEmailProcessing: false,
            ...(sent ? { confirmationEmailSentAt: new Date() } : {}),
        },
    });

    return sent;
}
