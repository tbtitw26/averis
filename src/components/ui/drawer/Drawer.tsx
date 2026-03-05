import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@mui/material";
import styles from "./Drawer.module.scss";
import Image from "next/image";
import AuthButtons from "@/components/widgets/auth-buttons/AuthButtons";
import { headerContent } from "@/resources/content";
import { drawerConfig } from "@/resources/styles-config";
import { DrawerMenuProps } from "@/types/drawer-menu";
import { IoCloseSharp } from "react-icons/io5";
import { useCurrency } from "@/context/CurrencyContext";

const DrawerMenu: FC<DrawerMenuProps> = ({ open, onClose }) => {
    const cfg = drawerConfig;
    const { currency, setCurrency } = useCurrency();

    const currencies = useMemo(
        () => ["GBP", "EUR", "USD", "AUD", "CAD", "NZD", "NOK"] as const,
        []
    );

    const [curOpen, setCurOpen] = useState(false);
    const currencyRef = useRef<HTMLDivElement | null>(null);

    // Закривати dropdown коли Drawer закрили
    useEffect(() => {
        if (!open) setCurOpen(false);
    }, [open]);

    // Закрити dropdown при кліку поза ним + ESC
    useEffect(() => {
        if (!curOpen) return;

        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (currencyRef.current && !currencyRef.current.contains(target)) {
                setCurOpen(false);
            }
        };

        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setCurOpen(false);
        };

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [curOpen]);

    return (
        <Drawer
            anchor={cfg.anchor}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: cfg.width,
                    fontFamily: "var(--app-font, 'Roboto', sans-serif)",
                    p: cfg.padding,
                },
            }}
        >
            <IoCloseSharp className={styles.closeIcon} onClick={onClose} />

            <div className={styles.content}>
                <div className={styles.topRow}>
                    <a
                        href={headerContent.logo.href}
                        className={styles.logo}
                        onClick={onClose}
                    >
                        <Image
                            width={cfg.logoWidth}
                            height={cfg.logoHeight}
                            src={headerContent.logo.src}
                            alt={headerContent.logo.alt}
                        />
                    </a>

                    <AuthButtons />

                    {/* ✅ Dropdown currency */}
                    <div className={styles.currencySwitch} ref={currencyRef}>
                        <div
                            className={styles.toggle}
                            onClick={() => setCurOpen((v) => !v)}
                            role="button"
                            aria-expanded={curOpen}
                            aria-label="Change currency"
                        >
                            <span className={styles.selected}>{currency}</span>

                            <svg
                                className={`${styles.arrow} ${curOpen ? styles.open : ""}`}
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                            >
                                <path fill="currentColor" d="M7 10l5 5 5-5z" />
                            </svg>
                        </div>

                        {curOpen && (
                            <div className={styles.dropdown}>
                                {currencies.map((c) => (
                                    <span
                                        key={c}
                                        className={`${styles.label} ${
                                            currency === c ? styles.activeLabel : ""
                                        }`}
                                        onClick={() => {
                                            setCurrency(c);
                                            setCurOpen(false);
                                        }}
                                    >
                    {c}
                  </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <nav className={styles.nav}>
                    {headerContent.links.map((link) => (
                        <a
                            href={link.href}
                            key={link.label}
                            className={styles.link}
                            onClick={onClose}
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>
        </Drawer>
    );
};

export default DrawerMenu;