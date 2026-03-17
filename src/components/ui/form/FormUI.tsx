"use client";
import React from "react";
import { Form, Field, ErrorMessage, useFormikContext } from "formik";
import styles from "./FormUI.module.scss";
import InputUI from "@/components/ui/input/InputUI";
import ButtonUI from "@/components/ui/button/ButtonUI";

interface FieldConfig {
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    fullWidth?: boolean;
    options?: Array<{ value: string; label: string }>;
}

interface FormUIProps {
    title: string;
    description?: string;
    isSubmitting?: boolean;
    fields?: FieldConfig[];
    submitLabel?: string;
    showTerms?: boolean;
    layout?: "default" | "wide";
}

const defaultFields: FieldConfig[] = [
    { name: "email", type: "email", placeholder: "Email" },
    { name: "password", type: "password", placeholder: "Password" },
];

const FormUI: React.FC<FormUIProps> = ({
                                           title,
                                           description,
                                           isSubmitting,
                                           fields = defaultFields,
                                           submitLabel = "Sign In",
                                           showTerms = false,
                                           layout = "default",
                                       }) => {
    const { values } = useFormikContext<any>(); // доступ до полів форми

    // Блокування кнопки, якщо чекбокс не натиснуто
    const isButtonDisabled =
        isSubmitting || (showTerms ? !values.terms : false);

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.formContainer} ${layout === "wide" ? styles.formContainerWide : ""}`}>
                <h2 className={styles.title}>{title}</h2>
                {description && <p className={styles.description}>{description}</p>}

                <Form className={styles.formContent}>
                    <div className={styles.fieldsGrid}>
                        {fields.map((field) => {
                            const { label, fullWidth, ...inputProps } = field;

                            return (
                                <div
                                    key={field.name}
                                    className={`${styles.fieldGroup} ${fullWidth ? styles.fieldSpanFull : ""}`}
                                >
                                    {label && (
                                        <label className={styles.fieldLabel} htmlFor={field.name}>
                                            {label}
                                        </label>
                                    )}
                                    <InputUI id={field.name} {...inputProps} formik />
                                </div>
                            );
                        })}
                    </div>

                    {showTerms && (
                        <div className={styles.termsBlock}>
                            <label className={styles.termsLabel}>
                                <Field type="checkbox" name="terms" />
                                <span>
                  I agree to the{" "}
                                    <a
                                        href="/terms-and-conditions"
                                        rel="noopener noreferrer"
                                    >
                    Terms & Conditions
                  </a>
                </span>
                            </label>
                            <ErrorMessage
                                name="terms"
                                component="div"
                                className={styles.errorText}
                            />
                        </div>
                    )}

                    <div className={styles.submitButton}>
                        <ButtonUI
                            type="submit"
                            text={submitLabel}
                            disabled={isButtonDisabled}
                            loading={isSubmitting}
                            fullWidth
                        />
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default FormUI;
