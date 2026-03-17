import Link from "next/link";

export default function NotFound() {
    return (
        <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
            <h1>404</h1>
            <p>This page does not exist.</p>
            <div style={{ marginTop: 16 }}>
                <Link href="/">Go home</Link>
            </div>
        </main>
    );
}
