"use client";
import React from "react";
import Link from "next/link";
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
    eyebrow?: string;
    title: string;
    description?: string;
    isSubmitting?: boolean;
    fields?: FieldConfig[];
    submitLabel?: string;
    showTerms?: boolean;
    layout?: "default" | "wide";
    accent?: "mint" | "emerald";
    sideTitle?: string;
    sideDescription?: string;
    highlights?: string[];
    stats?: Array<{ value: string; label: string }>;
    footerPrompt?: string;
    footerLinkLabel?: string;
    footerLinkHref?: string;
}

const defaultFields: FieldConfig[] = [
    { name: "email", type: "email", placeholder: "Email" },
    { name: "password", type: "password", placeholder: "Password" },
];

const FormUI: React.FC<FormUIProps> = ({
                                           eyebrow,
                                           title,
                                           description,
                                           isSubmitting,
                                           fields = defaultFields,
                                           submitLabel = "Sign In",
                                           showTerms = false,
                                           layout = "default",
                                           accent = "mint",
                                           sideTitle,
                                           sideDescription,
                                           highlights = [],
                                           stats = [],
                                           footerPrompt,
                                           footerLinkLabel,
                                           footerLinkHref,
}) => {
    const { values } = useFormikContext<{ terms?: boolean }>(); // доступ до полів форми

    // Блокування кнопки, якщо чекбокс не натиснуто
    const isButtonDisabled =
        isSubmitting || (showTerms ? !values.terms : false);

    return (
        <div className={styles.wrapper}>
            <section
                className={[
                    styles.shell,
                    layout === "wide" ? styles.shellWide : "",
                    accent === "emerald" ? styles.shellEmerald : styles.shellMint,
                ].join(" ").trim()}
            >
                <div className={styles.sidePanel}>
                    <div className={styles.sideGlow} />
                    <div className={styles.sideContent}>
                        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
                        <h2 className={styles.sideTitle}>{sideTitle || title}</h2>
                        {sideDescription && (
                            <p className={styles.sideDescription}>{sideDescription}</p>
                        )}

                        {stats.length > 0 && (
                            <div className={styles.statsGrid}>
                                {stats.map((stat) => (
                                    <div key={`${stat.value}-${stat.label}`} className={styles.statCard}>
                                        <strong>{stat.value}</strong>
                                        <span>{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {highlights.length > 0 && (
                            <ul className={styles.highlights}>
                                {highlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className={`${styles.formContainer} ${layout === "wide" ? styles.formContainerWide : ""}`}>
                    <div className={styles.formHeader}>
                        {eyebrow && <span className={styles.mobileEyebrow}>{eyebrow}</span>}
                        <h1 className={styles.title}>{title}</h1>
                        {description && <p className={styles.description}>{description}</p>}
                    </div>

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

                    {(footerPrompt && footerLinkLabel && footerLinkHref) && (
                        <p className={styles.footerNote}>
                            {footerPrompt}{" "}
                            <Link href={footerLinkHref}>{footerLinkLabel}</Link>
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FormUI;
