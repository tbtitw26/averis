import { AlertColor } from "@mui/material/Alert";
import { SignUpValues } from "@/components/widgets/sign-up/SignUp";
import { validateRegistrationInput } from "@/shared/auth/registration";

export const signUpInitialValues = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    email: "",
    street: "",
    city: "",
    country: "",
    postCode: "",
    password: "",
    confirmPassword: "",
    terms: false,
};

export const signUpValidation = (values: SignUpValues) => {
    return validateRegistrationInput(values, {
        requireConfirmPassword: true,
        requireTerms: true,
    }).errors;
};

export const signUpOnSubmit = async (
    values: SignUpValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
    showAlert: (msg: string, desc?: string, severity?: AlertColor) => void,
    router: { replace: (url: string) => void; refresh: () => void }
) => {
    try {
        const payload = validateRegistrationInput(values, {
            requireConfirmPassword: true,
            requireTerms: true,
        }).values;

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok && data?.user) {
            showAlert("Registration successful!", "", "success");
            router.replace("/");
            router.refresh();
        } else {
            showAlert(data?.message || "Registration failed", "", "error");
        }
    } catch (e: any) {
        showAlert(e?.message || "Network error", "", "error");
    } finally {
        setSubmitting(false);
    }
};
