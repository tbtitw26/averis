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
                    title="Sign Up"
                    description="Create your account"
                    layout="wide"
                    isSubmitting={isSubmitting}
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
                />
            )}
        </Formik>
    );
}
