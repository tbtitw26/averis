export type UserRole = "user" | "admin";

export interface IUser {
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
    role: UserRole;
    tokens: number | null;
    createdAt: string;
    updatedAt: string;
}

export type Nullable<T> = T | null;

export interface UserResponse {
    user: IUser;
}
