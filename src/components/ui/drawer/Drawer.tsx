import React, { FC } from "react";
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

                    {/* 🔥 Toggle замість select */}
                    <div className={styles.currencySwitch}>
                        <div className={`${styles.toggle} ${styles[currency.toLowerCase()]}`}>
                            <span
                                className={`${styles.label} ${currency === "AUD" ? styles.activeLabel : ""}`}
                                onClick={() => setCurrency("AUD")}
                            >
                                AUD
                            </span>

                            <span
                                className={`${styles.label} ${currency === "CAD" ? styles.activeLabel : ""}`}
                                onClick={() => setCurrency("CAD")}
                            >
                                CAD
                            </span>

                            <span
                                className={`${styles.label} ${currency === "NZD" ? styles.activeLabel : ""}`}
                                onClick={() => setCurrency("NZD")}
                            >
                                NZD
                            </span>

                            <div className={styles.thumb} />
                        </div>
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
