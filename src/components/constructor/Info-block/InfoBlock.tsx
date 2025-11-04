"use client";
import React from "react";
import styles from "./InfoBlock.module.scss";
import Media from "../image/Media";
import Text from "../text/Text";
import ButtonUI from "@/components/ui/button/ButtonUI";

interface InfoBlockProps {
    title?: string;
    description?: string;
    icon?: string;
    image?: string;
    bullets?: string[];
    align?: "left" | "center" | "right";
    buttonText?: string;
    buttonLink?: string;
}

const InfoBlock: React.FC<InfoBlockProps> = ({
                                                 title,
                                                 description,
                                                 icon,
                                                 image,
                                                 bullets,
                                                 align = "left",
                                                 buttonText,
                                                 buttonLink,
                                             }) => {
    return (
        <div className={`${styles.infoBlock} ${styles[align]}`}>
            {icon && <div className={styles.icon}>{icon}</div>}

            {image && (
                <div className={styles.imageWrapper}>
                    <Media
                        src={image}
                        type="image"
                        width="100%"
                        height="200px"
                        alt={title || "Info"}
                        objectFit="cover"
                    />
                </div>
            )}

            <Text
                title={title}
                description={description}
                bullets={bullets}
                centerTitle={align === "center"}
                centerDescription={align === "center"}
                centerBullets={align === "center"}
            />

            {buttonText && buttonLink && (
                <a href={buttonLink} rel="noopener noreferrer" className={styles.buttonWrapper}>
                    <ButtonUI
                        variant="solid"
                        shape="rounded"
                        size="md"
                        textColor="quaternary"
                        color="primary"
                        hoverEffect="shadow"
                    >
                        {buttonText}
                    </ButtonUI>
                </a>
            )}
        </div>
    );
};

export default InfoBlock;
