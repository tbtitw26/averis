"use client";

import { FaUserCircle, FaRunning, FaDumbbell } from "react-icons/fa";
import styles from "./ProfileHead.module.scss";
import { useUser } from "@/context/UserContext";

const ProfileHead = () => {
    const user = useUser();

    return (
        <header className={styles.hero}>
            <div className={styles.hero__avatar}>
                <FaUserCircle />
            </div>

            <div className={styles.hero__text}>
                <h1 className={styles.hero__title}>
                    Welcome back, <span>{user?.firstName || user?.name || "Athlete"}</span> 💪
                </h1>
                <p className={styles.hero__subtitle}>
                    {user?.phoneNumber
                        ? `${user.email} · ${user.phoneNumber}`
                        : "Your personalized dashboard — track tokens, view your progress, and manage your fitness plans."}
                </p>

                <div className={styles.hero__stats}>
                    <div>
                        <FaDumbbell />
                        <span>{user?.tokens ?? 0} Tokens</span>
                    </div>
                    <div>
                        <FaRunning />
                        <span>3 Active Plans</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ProfileHead;
