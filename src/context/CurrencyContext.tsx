"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Currency =
    | "AUD"
    | "CAD"
    | "NZD";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (val: Currency) => void;
    sign: string;
    rateToGBP: number;
    convertFromGBP: (gbp: number) => number;
    convertToGBP: (val: number) => number;
}

const CURRENCY_SIGNS: Record<Currency, string> = {
    AUD: "A$",
    CAD: "C$",
    NZD: "NZ$",
};

// 1 GBP = X currency
const RATES: Record<Currency, number> = {
    AUD: 2.04,
    CAD: 1.76,
    NZD: 2.22,
};

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "AUD",
    setCurrency: () => {},
    sign: "A$",
    rateToGBP: 2.04,
    convertFromGBP: (v) => v,
    convertToGBP: (v) => v,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
    const [currency, setCurrency] = useState<Currency>("AUD");

    const rateToGBP = RATES[currency];
    const sign = CURRENCY_SIGNS[currency];

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                sign,
                rateToGBP,
                convertFromGBP: (gbp) => gbp * rateToGBP,
                convertToGBP: (val) => val / rateToGBP,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
};
