"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { headerContent } from "@/resources/content";
import styles from "./Header.module.scss";
import { IconButton } from "@mui/material";
import { FaBars } from "react-icons/fa";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import AuthButtons from "@/components/widgets/auth-buttons/AuthButtons";
import { headerStyles } from "@/resources/styles-config";
import DrawerMenu from "@/components/ui/drawer/Drawer";
import { useCurrency } from "@/context/CurrencyContext";
import { motion } from "framer-motion";

const Header: React.FC = () => {
    const currencies = useMemo(
        () => ["GBP", "EUR", "USD", "AUD", "CAD", "NZD", "NOK"] as const,
        []
    );

    const [open, setOpen] = useState(false);
    const currencyRef = useRef<HTMLDivElement | null>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const user = useUser();
    const { currency, setCurrency } = useCurrency();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Закрити dropdown при кліку поза ним
    useEffect(() => {
        if (!open) return;

        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (currencyRef.current && !currencyRef.current.contains(target)) {
                setOpen(false);
            }
        };

        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    // динамічні стилі при скролі
    const scrolledStyle: React.CSSProperties = {};
    if (isScrolled && headerStyles.type !== "default") {
        switch (headerStyles.scrollMode) {
            case "solid":
                scrolledStyle.backgroundColor = headerStyles.scrollBackground;
                break;
            case "blur":
                scrolledStyle.backdropFilter = `blur(${headerStyles.scrollBlur})`;
                scrolledStyle.backgroundColor = "rgba(255,255,255,0.05)";
                break;
        }
    }

    return (
        <>
            <motion.header
                className={[
                    headerStyles.type === "sticky" && styles.sticky,
                    isScrolled ? styles.scrolled : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
                style={scrolledStyle}
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className={styles.headerInner}>
                    {/* Ліва частина — логотип */}
                    <a href={headerContent.logo.href} className={styles.logo}>
                        <Image
                            width={190}
                            height={60}
                            src={headerContent.logo.src}
                            alt={headerContent.logo.alt}
                        />
                    </a>

                    {/* Центр — навігація */}
                    <nav className={styles.nav}>
                        {headerContent.links.map((link) => (
                            <a key={link.label} href={link.href} className={styles.link}>
                                {link.label}
                            </a>
                        ))}
                        {user && (
                            <a href="/dashboard" className={styles.link}>
                                Dashboard
                            </a>
                        )}
                    </nav>

                    {/* Права частина — кнопки */}
                    <div className={styles.actionsNav}>
                        <AuthButtons />

                        <div className={styles.currencySwitch} ref={currencyRef}>
                            <div className={styles.toggle} onClick={() => setOpen((v) => !v)}>
                                <span className={styles.selected}>{currency}</span>

                                <svg
                                    className={`${styles.arrow} ${open ? styles.open : ""}`}
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                >
                                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                                </svg>
                            </div>

                            {open && (
                                <div className={styles.dropdown}>
                                    {currencies.map((c) => (
                                        <span
                                            key={c}
                                            className={`${styles.label} ${
                                                currency === c ? styles.activeLabel : ""
                                            }`}
                                            onClick={() => {
                                                setCurrency(c);
                                                setOpen(false);
                                            }}
                                        >
                      {c}
                    </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu */}
                    <div className={styles.menuButton}>
                        <IconButton
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open navigation"
                            className={styles.button}
                        >
                            <FaBars className={styles.button} />
                        </IconButton>
                    </div>
                </div>
            </motion.header>

            <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
};

export default Header;