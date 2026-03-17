import { Document, Types } from "mongoose";

export interface IUserSchema extends Document {
    _id: Types.ObjectId;
    name: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    dateOfBirth: Date | null;
    street: string | null;
    city: string | null;
    country: string | null;
    postCode: string | null;
    email: string;
    password: string;
    tokens: number;
    role: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

export interface UserType {
    _id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
    dateOfBirth: string | null;
    address: {
        street: string | null;
        city: string | null;
        country: string | null;
        postCode: string | null;
    };
    email: string;
    tokens: number;
    role: "user" | "admin";
    createdAt: string;
    updatedAt: string;
}
