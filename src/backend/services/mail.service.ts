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
    await deliverConfirmationEmail({
        user,
        subject: "Welcome to Averis",
        summary: "Your account has been created successfully.",
        amountLabel: "Account status",
        amountValue: "Active",
        details: [
            { label: "Email", value: user.email },
            { label: "Next step", value: "Sign in and complete your first order" },
        ],
        transactionDate: new Date(),
        ctaPath: "/profile",
    });
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
    model: Model<any>,
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
