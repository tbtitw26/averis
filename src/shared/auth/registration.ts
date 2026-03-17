import { isAllowedCountry } from "@/shared/constants/countries";

export interface RegistrationAddressInput {
    street: string;
    city: string;
    country: string;
    postCode: string;
}

export interface RegistrationInput extends RegistrationAddressInput {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    email: string;
    password: string;
    confirmPassword?: string;
    terms?: boolean;
}

export interface RegistrationValidationResult {
    values: RegistrationInput;
    errors: Partial<Record<keyof RegistrationInput | "terms", string>>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimValue(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export function buildUserName(firstName: string, lastName: string) {
    return `${firstName} ${lastName}`.trim();
}

export function parseDateOfBirth(input: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;

    const [year, month, day] = input.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date;
}

export function normalizeRegistrationInput(input: Partial<RegistrationInput>): RegistrationInput {
    return {
        firstName: trimValue(input.firstName),
        lastName: trimValue(input.lastName),
        phoneNumber: trimValue(input.phoneNumber),
        dateOfBirth: trimValue(input.dateOfBirth),
        email: trimValue(input.email).toLowerCase(),
        street: trimValue(input.street),
        city: trimValue(input.city),
        country: trimValue(input.country),
        postCode: trimValue(input.postCode),
        password: typeof input.password === "string" ? input.password : "",
        confirmPassword:
            typeof input.confirmPassword === "string" ? input.confirmPassword : undefined,
        terms: input.terms,
    };
}

export function validateRegistrationInput(
    input: Partial<RegistrationInput>,
    options?: { requireConfirmPassword?: boolean; requireTerms?: boolean }
): RegistrationValidationResult {
    const values = normalizeRegistrationInput(input);
    const errors: RegistrationValidationResult["errors"] = {};

    if (!values.firstName) errors.firstName = "First name is required";
    if (!values.lastName) errors.lastName = "Last name is required";
    if (!values.dateOfBirth) {
        errors.dateOfBirth = "Date of birth is required";
    } else if (!parseDateOfBirth(values.dateOfBirth)) {
        errors.dateOfBirth = "Enter a valid date of birth";
    }

    if (!values.email) {
        errors.email = "Email is required";
    } else if (!EMAIL_REGEX.test(values.email)) {
        errors.email = "Enter a valid email address";
    }

    if (!values.phoneNumber) errors.phoneNumber = "Phone number is required";
    if (!values.street) errors.street = "Street is required";
    if (!values.city) errors.city = "City is required";
    if (!values.country) {
        errors.country = "Country is required";
    } else if (!isAllowedCountry(values.country)) {
        errors.country = "Select a valid country";
    }
    if (!values.postCode) errors.postCode = "Post code is required";
    if (!values.password) errors.password = "Password is required";

    if (options?.requireConfirmPassword) {
        if (!values.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        } else if (values.password !== values.confirmPassword) {
            errors.confirmPassword = "Passwords must match";
        }
    }

    if (options?.requireTerms && !values.terms) {
        errors.terms = "You must agree to the Terms and Conditions";
    }

    return { values, errors };
}
