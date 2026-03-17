import { UserType } from "@/backend/types/user.types";

export function mapUserToUserType(user: any): UserType {
    return {
        _id: user._id.toString(),
        name: user.name,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        phoneNumber: user.phoneNumber ?? null,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : null,
        address: {
            street: user.street ?? null,
            city: user.city ?? null,
            country: user.country ?? null,
            postCode: user.postCode ?? null,
        },
        email: user.email,
        role: user.role,
        tokens: user.tokens,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
    };
}
