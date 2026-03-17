import { cookies, headers } from "next/headers";
import { ComponentType, ReactNode } from "react";
import { UserProvider } from "@/context/UserContext";
import { IUser, Nullable } from "@/types/user.types";
import { ENV } from "@/backend/config/env";

interface WrappedComponentProps { children?: ReactNode; }

async function getServerOrigin() {
    const h = await headers();
    const forwardedProto = h.get("x-forwarded-proto");
    const forwardedHost = h.get("x-forwarded-host");
    const host = forwardedHost || h.get("host");

    if (host) {
        const proto = forwardedProto || (ENV.NODE_ENV === "production" ? "https" : "http");
        return `${proto}://${host}`;
    }

    return ENV.APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
}

export function authWrapper<T extends WrappedComponentProps>(Component: ComponentType<T>) {
    return async function WrappedComponent(props: T) {
        let user: Nullable<IUser> = null;
        const c = await cookies();
        const origin = await getServerOrigin();

        try {
            const res = await fetch(`${origin}/api/auth/me`, {
                method: "GET",
                headers: { Cookie: c.toString() },
                cache: "no-store",
            });

            if (res.ok) {
                const json = await res.json();
                user = json.user;
            } else {
                const refreshToken = c.get(ENV.REFRESH_COOKIE_NAME);
                if (refreshToken) {
                    const r = await fetch(`${origin}/api/auth/refresh`, {
                        method: "POST",
                        headers: { Cookie: c.toString() },
                        cache: "no-store",
                    });
                    if (r.ok) {
                        const json = await r.json();
                        user = json.user;
                    } else {
                        console.warn("authWrapper: refresh failed with", r.status);
                    }
                }
            }
        } catch (e) {
            console.error("authWrapper user fetch error:", e);
        }

        return (
            <UserProvider user={user}>
                <Component {...props} />
            </UserProvider>
        );
    };
}
