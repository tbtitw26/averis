"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./PricingCard.module.scss";
import ButtonUI from "@/components/ui/button/ButtonUI";
import { useAlert } from "@/context/AlertContext";
import { useUser } from "@/context/UserContext";
import Input from "@mui/joy/Input";
import Checkbox from "@mui/joy/Checkbox";
import { useCurrency } from "@/context/CurrencyContext";

const TOKENS_PER_GBP = 100;
const MIN_AMOUNT = 10;

interface PricingCardProps {
    variant?: "starter" | "pro" | "premium" | "custom";
    title: string;
    price: string;
    tokens: number;
    description: string;
    features: string[];
    buttonText: string;
    buttonLink?: string;
    badgeTop?: string;
    badgeBottom?: string;
    index?: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
                                                     variant = "starter",
                                                     title,
                                                     price,
                                                     tokens,
                                                     description,
                                                     features,
                                                     buttonText,
                                                     badgeTop,
                                                     badgeBottom,
                                                     index = 0,
                                                 }) => {
    const { showAlert } = useAlert();
    const user = useUser();
    const { currency, sign, convertFromGBP, convertToGBP } = useCurrency();

    const [customAmount, setCustomAmount] = useState<number>(MIN_AMOUNT);
    const [customAmountRaw, setCustomAmountRaw] = useState<string>(MIN_AMOUNT.toFixed(2));
    const [isAgreed, setIsAgreed] = useState(false);

    const isCustom = price === "dynamic";

    const minAmountInCurrency = useMemo(() => MIN_AMOUNT, []);

    useEffect(() => {
        if (!isCustom) return;
        const minValue = Number(minAmountInCurrency.toFixed(2));
        if (!Number.isFinite(customAmount) || customAmount < minValue) {
            setCustomAmount(minValue);
            setCustomAmountRaw(minValue.toFixed(2));
        }
    }, [isCustom, minAmountInCurrency, customAmount]);

    const basePriceGBP = useMemo(
        () => (isCustom ? 0 : parseFloat(price.replace(/[^0-9.]/g, ""))),
        [price, isCustom]
    );

    const convertedPrice = useMemo(
        () => (isCustom ? 0 : convertFromGBP(basePriceGBP)),
        [basePriceGBP, convertFromGBP, isCustom]
    );

    const handleBuy = async () => {
        if (!isAgreed) {
            showAlert("Agreement required", "Please accept the terms before purchase", "warning");
            return;
        }

        if (!user) {
            showAlert("Please sign up", "You need to be signed in to purchase", "info");
            setTimeout(() => (window.location.href = "/sign-up"), 1200);
            return;
        }

        try {
            const endpoint = "/api/spoynt/create-invoice";

            let body: any;

            if (isCustom) {
                const amountValue = Number(customAmountRaw);
                if (!Number.isFinite(amountValue) || amountValue < MIN_AMOUNT) {
                    showAlert(
                        "Minimum is 10",
                        `Enter at least ${MIN_AMOUNT.toFixed(2)} ${currency}`,
                        "warning"
                    );
                    return;
                }

                body = { currency, amount: amountValue };
            } else {
                if (convertedPrice < MIN_AMOUNT) {
                    showAlert(
                        "Minimum is 10",
                        `Select a plan with at least ${MIN_AMOUNT} ${currency}`,
                        "warning"
                    );
                    return;
                }

                body = { tokens };
            }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text);

            const data = JSON.parse(text);

            const purchaseIntent = {
                tokens: isCustom
                    ? Math.floor(convertToGBP(Number(customAmountRaw)) * TOKENS_PER_GBP)
                    : tokens,
                createdAt: Date.now(),
            };

            localStorage.setItem("pendingPurchase", JSON.stringify(purchaseIntent));

            window.location.href = data.redirectUrl;
        } catch (err: any) {
            showAlert("Error", err.message || "Something went wrong", "error");
        }
    };

    return (
        <motion.div
            className={`${styles.card} ${styles[variant]}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.15 }}
        >
            {badgeTop && <span className={styles.badgeTop}>{badgeTop}</span>}
            <h3 className={styles.title}>{title}</h3>

            {isCustom ? (
                <>
                    <div className={styles.inputWrapper}>
                        <Input
                            type="number"
                            value={customAmountRaw}
                            min={MIN_AMOUNT}
                            step={0.01}
                            onChange={(e) => {
                                setCustomAmountRaw(e.target.value);
                            }}
                            onBlur={() => {
                                const parsed = Number(customAmountRaw);
                                const nextValue = Number.isFinite(parsed)
                                    ? Math.max(MIN_AMOUNT, parsed)
                                    : MIN_AMOUNT;
                                setCustomAmount(nextValue);
                                setCustomAmountRaw(nextValue.toFixed(2));
                            }}
                            placeholder="Enter amount"
                            size="md"
                            startDecorator={sign}
                        />
                    </div>
                    <p className={styles.dynamicPrice}>
                        {sign}
                        {(Number(customAmountRaw) || MIN_AMOUNT).toFixed(2)} ≈{" "}
                        {Math.floor(convertToGBP(Number(customAmountRaw) || MIN_AMOUNT) * TOKENS_PER_GBP)} tokens
                    </p>
                </>
            ) : (
                <p className={styles.price}>
                    {sign}
                    {convertedPrice.toFixed(2)}{" "}
                    <span className={styles.tokens}>/ {tokens} tokens</span>
                </p>
            )}

            <p className={styles.description}>{description}</p>

            <ul className={styles.features}>
                {features.map((f, i) => (
                    <li key={i}>{f}</li>
                ))}
            </ul>

            <div className={styles.checkboxWrapper}>
                <Checkbox
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                />

                <span className={styles.checkboxText}>
        I have read and agree to the{" "}
                    <Link
                        href="/terms-and-conditions"
                        target="_blank"
                        className={styles.termsLink}
                    >
            Terms and Conditions
        </Link>
    </span>
            </div>

            <ButtonUI fullWidth onClick={handleBuy} disabled={!isAgreed}>
                {user ? buttonText : "Sign Up to Buy"}
            </ButtonUI>

            {badgeBottom && <span className={styles.badgeBottom}>{badgeBottom}</span>}
        </motion.div>
    );
};

export default PricingCard;