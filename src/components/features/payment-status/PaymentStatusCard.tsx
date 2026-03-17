import Link from "next/link";
import styles from "./PaymentStatusCard.module.scss";

type Tone = "success" | "pending" | "error" | "loading";

type Detail = {
    label: string;
    value: string;
};

type Action = {
    href: string;
    label: string;
    variant?: "primary" | "secondary";
};

type TimelineItem = {
    title: string;
    text: string;
    state?: "default" | "done" | "active" | "warn";
};

type PaymentStatusCardProps = {
    tone: Tone;
    eyebrow: string;
    badge: string;
    orbLabel: string;
    title: string;
    subtitle: string;
    message: string;
    details: Detail[];
    actions: Action[];
    timeline: TimelineItem[];
    notice: string;
    meta?: string;
};

const toneClassMap: Record<Tone, string> = {
    success: styles.toneSuccess,
    pending: styles.tonePending,
    error: styles.toneError,
    loading: styles.toneLoading,
};

const timelineStateClass: Record<NonNullable<TimelineItem["state"]>, string> = {
    default: "",
    done: styles.timelineDone,
    active: styles.timelineActive,
    warn: styles.timelineWarn,
};

export default function PaymentStatusCard({
    tone,
    eyebrow,
    badge,
    orbLabel,
    title,
    subtitle,
    message,
    details,
    actions,
    timeline,
    notice,
    meta,
}: PaymentStatusCardProps) {
    return (
        <main className={styles.page}>
            <section className={styles.shell}>
                <div className={`${styles.panel} ${toneClassMap[tone]}`}>
                    <div className={styles.hero}>
                        <div className={styles.heroContent}>
                            <span className={styles.eyebrow}>{eyebrow}</span>
                            <h1 className={styles.title}>{title}</h1>
                            <p className={styles.subtitle}>{subtitle}</p>
                        </div>

                        <div className={styles.orb}>{orbLabel}</div>
                    </div>

                    <span className={styles.statusPill}>{badge}</span>
                    <p className={styles.message}>{message}</p>

                    <div className={styles.detailsGrid}>
                        {details.map((detail) => (
                            <div key={detail.label} className={styles.detailCard}>
                                <span className={styles.detailLabel}>{detail.label}</span>
                                <span className={styles.detailValue}>{detail.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.actions}>
                        {actions.map((action) => (
                            <Link
                                key={`${action.href}-${action.label}`}
                                href={action.href}
                                className={
                                    action.variant === "secondary" ? styles.secondaryAction : styles.primaryAction
                                }
                            >
                                {action.label}
                            </Link>
                        ))}
                    </div>

                    {meta ? <p className={styles.meta}>{meta}</p> : null}
                </div>

                <aside className={styles.sideCard}>
                    <h2 className={styles.sideTitle}>Payment Flow</h2>

                    <div className={styles.timeline}>
                        {timeline.map((item) => (
                            <div key={item.title} className={styles.timelineItem}>
                                <div
                                    className={`${styles.timelineDot} ${
                                        timelineStateClass[item.state || "default"]
                                    }`}
                                />
                                <div>
                                    <p className={styles.timelineHeading}>{item.title}</p>
                                    <p className={styles.timelineText}>{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.notice}>{notice}</div>
                </aside>
            </section>
        </main>
    );
}
