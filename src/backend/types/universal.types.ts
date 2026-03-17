import { Types } from "mongoose";

export interface UniversalOrderType {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    category: string;
    fields: Record<string, any>;
    extras: string[];
    totalTokens: number;
    planType: "default" | "reviewed";
    language?: string;
    response: string;
    extrasData: Record<string, string>;
    confirmationEmailSentAt?: Date | null;
    status: "pending" | "ready";
    readyAt: Date;
    createdAt: Date;
}

export interface CreateUniversalOrderRequest {
    category: string;
    fields: Record<string, any>;
    extras: string[];
    totalTokens: number;
    planType: "default" | "reviewed";
    language?: string;
    email: string;
}

export interface CreateUniversalOrderResponse {
    order: UniversalOrderType;
}
