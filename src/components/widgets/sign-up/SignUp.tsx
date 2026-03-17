"use client";

import { Formik, FormikHelpers } from "formik";
import { useAlert } from "@/context/AlertContext";
import { useRouter } from "next/navigation";
import {
    signUpValidation,
    signUpInitialValues,
    signUpOnSubmit,
} from "@/validationSchemas/sign-up/schema";
import FormUI from "@/components/ui/form/FormUI";
import { RegistrationInput } from "@/shared/auth/registration";
import { ALLOWED_COUNTRIES } from "@/shared/constants/countries";

export type SignUpValues = RegistrationInput & {
    terms: boolean;
};

export default function SignUpPage() {
    const { showAlert } = useAlert();
    const router = useRouter();

    return (
        <Formik<SignUpValues>
            initialValues={signUpInitialValues}
            validate={signUpValidation}
            onSubmit={async (
                values,
                { setSubmitting }: FormikHelpers<SignUpValues>
            ) => signUpOnSubmit(values, { setSubmitting }, showAlert, router)}
        >
            {({ isSubmitting }) => (
                <FormUI
                    eyebrow="New Account"
                    title="Create your Averis profile"
                    description="Set up your details once and keep your training, billing, and personal information in one polished space."
                    layout="wide"
                    isSubmitting={isSubmitting}
                    accent="emerald"
                    sideTitle="Start with a profile that feels premium from day one."
                    sideDescription="Registration is structured for clarity: essential personal details, address information, and secure account setup in one uninterrupted flow."
                    stats={[
                        { value: "Secure", label: "Protected login and account management" },
                        { value: "2 min", label: "Typical setup time for a complete profile" },
                    ]}
                    highlights={[
                        "Clear grouping of personal, contact, and address fields.",
                        "Responsive layout that stays readable on mobile and desktop.",
                        "Direct route into your account as soon as registration completes.",
                    ]}
                    fields={[
                        { name: "firstName", type: "text", label: "First name", placeholder: "Enter your first name" },
                        { name: "lastName", type: "text", label: "Last name", placeholder: "Enter your last name" },
                        { name: "dateOfBirth", type: "date", label: "Date of birth", placeholder: "YYYY-MM-DD" },
                        { name: "email", type: "email", label: "Email", placeholder: "Enter your email address", fullWidth: true },
                        { name: "phoneNumber", type: "text", label: "Phone number", placeholder: "Enter your phone number" },
                        { name: "street", type: "text", label: "Street", placeholder: "Street and house number", fullWidth: true },
                        { name: "city", type: "text", label: "City", placeholder: "Enter your city" },
                        {
                            name: "country",
                            type: "select",
                            label: "Country",
                            placeholder: "Select your country",
                            options: ALLOWED_COUNTRIES.map((country) => ({
                                value: country.label,
                                label: country.label,
                            })),
                        },
                        { name: "postCode", type: "text", label: "Post code", placeholder: "Enter your post code" },
                        { name: "password", type: "password", label: "Password", placeholder: "Create a password" },
                        { name: "confirmPassword", type: "password", label: "Confirm password", placeholder: "Re-enter your password" },
                    ]}
                    submitLabel="Sign Up"
                    showTerms
                    footerPrompt="Already registered?"
                    footerLinkLabel="Sign in"
                    footerLinkHref="/sign-in"
                />
            )}
        </Formik>
    );
}
