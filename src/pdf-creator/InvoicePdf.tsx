import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
    COMPANY_ADDRESS,
    COMPANY_EMAIL,
    COMPANY_LEGAL_NAME,
    COMPANY_NAME,
    COMPANY_NUMBER,
    COMPANY_PHONE,
} from "@/resources/constants";

type InvoicePdfData = {
    invoiceNumber: string;
    issueDate: Date;
    paidDate: Date;
    customerName: string;
    customerEmail: string;
    referenceId: string;
    cpi: string;
    tokens: number;
    amount: number;
    currency: string;
};

const styles = StyleSheet.create({
    page: {
        paddingTop: 36,
        paddingBottom: 36,
        paddingHorizontal: 40,
        fontSize: 11,
        fontFamily: "Helvetica",
        color: "#14213d",
        backgroundColor: "#ffffff",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 24,
    },
    col: {
        flexDirection: "column",
    },
    title: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 10,
        color: "#5c677d",
        marginBottom: 2,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: "#5c677d",
        marginBottom: 8,
    },
    text: {
        marginBottom: 4,
        lineHeight: 1.45,
    },
    table: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#d9e2ec",
        borderStyle: "solid",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#edf2f7",
        borderBottomWidth: 1,
        borderBottomColor: "#d9e2ec",
        borderBottomStyle: "solid",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#d9e2ec",
        borderBottomStyle: "solid",
    },
    cell: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexGrow: 1,
    },
    cellWide: {
        width: "46%",
    },
    cellNarrow: {
        width: "18%",
        textAlign: "right",
    },
    strong: {
        fontWeight: 700,
    },
    totalBox: {
        marginTop: 16,
        marginLeft: "auto",
        width: 220,
        borderWidth: 1,
        borderColor: "#d9e2ec",
        borderStyle: "solid",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#d9e2ec",
        borderBottomStyle: "solid",
    },
    totalFinal: {
        backgroundColor: "#14213d",
        color: "#ffffff",
    },
    footer: {
        marginTop: 28,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#d9e2ec",
        borderTopStyle: "solid",
        fontSize: 10,
        color: "#5c677d",
        lineHeight: 1.45,
    },
});

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(date);
}

function formatMoney(amount: number, currency: string) {
    return `${amount.toFixed(2)} ${currency}`;
}

function InvoicePdfDocument(data: InvoicePdfData) {
    const companyName = COMPANY_NAME || "Averis";
    const legalName = COMPANY_LEGAL_NAME || companyName;

    return (
        <Document title={`Invoice ${data.invoiceNumber}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.title}>Invoice</Text>
                        <Text style={styles.subtitle}>{companyName}</Text>
                        <Text style={styles.subtitle}>Invoice No: {data.invoiceNumber}</Text>
                        <Text style={styles.subtitle}>Issue date: {formatDate(data.issueDate)}</Text>
                        <Text style={styles.subtitle}>Paid date: {formatDate(data.paidDate)}</Text>
                        <Text style={styles.subtitle}>Status: Paid</Text>
                    </View>

                    <View style={styles.col}>
                        <Text style={[styles.text, styles.strong]}>{legalName}</Text>
                        {COMPANY_NUMBER ? <Text style={styles.text}>Company No: {COMPANY_NUMBER}</Text> : null}
                        {COMPANY_ADDRESS ? <Text style={styles.text}>{COMPANY_ADDRESS}</Text> : null}
                        {COMPANY_PHONE ? <Text style={styles.text}>{COMPANY_PHONE}</Text> : null}
                        {COMPANY_EMAIL ? <Text style={styles.text}>{COMPANY_EMAIL}</Text> : null}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill To</Text>
                    <Text style={[styles.text, styles.strong]}>{data.customerName}</Text>
                    <Text style={styles.text}>{data.customerEmail}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Reference</Text>
                    <Text style={styles.text}>Merchant reference: {data.referenceId}</Text>
                    <Text style={styles.text}>Spoynt invoice ID: {data.cpi}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.cell, styles.cellWide, styles.strong]}>Description</Text>
                        <Text style={[styles.cell, styles.cellNarrow, styles.strong]}>Qty</Text>
                        <Text style={[styles.cell, styles.cellNarrow, styles.strong]}>Unit</Text>
                        <Text style={[styles.cell, styles.cellNarrow, styles.strong]}>Total</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.cell, styles.cellWide]}>Averis token purchase ({data.tokens} tokens)</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>1</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{formatMoney(data.amount, data.currency)}</Text>
                        <Text style={[styles.cell, styles.cellNarrow]}>{formatMoney(data.amount, data.currency)}</Text>
                    </View>
                </View>

                <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                        <Text>Subtotal</Text>
                        <Text>{formatMoney(data.amount, data.currency)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>Tax</Text>
                        <Text>0.00 {data.currency}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.totalFinal]}>
                        <Text>Total paid</Text>
                        <Text>{formatMoney(data.amount, data.currency)}</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    Thank you for your purchase. This invoice confirms successful payment for your Averis token package.
                </Text>
            </Page>
        </Document>
    );
}

export async function renderInvoicePdfBuffer(data: InvoicePdfData) {
    return renderToBuffer(<InvoicePdfDocument {...data} />);
}
