"use client";

import { Formik, FormikHelpers } from "formik";
import { useAlert } from "@/context/AlertContext";
import { useRouter } from "next/navigation";
import {
    signInValidation,
    signInInitialValues,
    signInOnSubmit
} from "@/validationSchemas/sign-in/schema";
import FormUI from "@/components/ui/form/FormUI";

export type SignInValues = { email: string; password: string };

export default function SignInPage() {
    const { showAlert } = useAlert();
    const router = useRouter();

    return (
        <Formik<SignInValues>
            initialValues={signInInitialValues}
            validate={signInValidation}
            onSubmit={async (values, { setSubmitting }: FormikHelpers<SignInValues>) =>
                signInOnSubmit(values, { setSubmitting }, showAlert, router)
            }
        >
            {({ isSubmitting }) => (
                <FormUI
                    eyebrow="Member Access"
                    title="Sign in to your account"
                    description="Pick up where you left off, manage your profile, and keep your training flow moving."
                    isSubmitting={isSubmitting}
                    accent="mint"
                    sideTitle="Everything important, one clean dashboard."
                    sideDescription="Access your programs, payments, and personal details from a focused workspace designed to stay out of your way."
                    stats={[
                        { value: "24/7", label: "Access to your account and training data" },
                        { value: "1 tap", label: "Fast return to your active plan and profile" },
                    ]}
                    highlights={[
                        "Review your plan, billing, and profile from one place.",
                        "Return to active coaching flows without extra steps.",
                        "A calmer interface with stronger hierarchy and readability.",
                    ]}
                    fields={[
                        { name: "email", type: "email", placeholder: "Email" },
                        { name: "password", type: "password", placeholder: "Password" }
                    ]}
                    submitLabel="Continue"
                    footerPrompt="No account yet?"
                    footerLinkLabel="Create one"
                    footerLinkHref="/sign-up"
                />
            )}
        </Formik>
    );
}
