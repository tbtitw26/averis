"use client";

import React from "react";
import { media as mediaMap } from "@/resources/media";
import Media from "../image/Media";
import Section from "../section/Section";
import Text from "../text/Text";
import Card from "../card/Card";
import Grid from "../grid/Grid";
import Slider from "../slider/Slider";
import FAQ from "../faq/FAQ";
import PricingCard from "../pricing-card/PricingCard";
import HighlightStrip from "../highlight-strip/HighlightStrip";
import Marquee from "../marquee/Marquee";
import Timeline from "../timeline/Timeline";

import type {
    PageSchema,
    PageBlock,
    MediaBlock,
    TextBlock,
    SectionBlock,
    GridBlock,
    SliderBlock,
    FaqBlock,
    CardBlock,
    PricingBlock,
    GridItem,
    AlignInput,
    CustomBlock,
} from "./types";

import MissionBanner from "@/components/constructor/missio-banner/MissionBanner";
import ContactUsForm from "@/components/widgets/contact-form/ContactForm";
import LogoBlock from "@/components/constructor/logo-block/LogoBlock";
import ValuesIcons from "@/components/constructor/values-icons/ValuesIcons";
import TeamGrid from "../team-grid/TeamGrid";
import HeroSection from "@/components/constructor/hero/Hero";
import TestimonialsSlider from "@/components/constructor/testimonials-slider/TestimonialsSlider";
import VideoDemo from "@/components/constructor/video-demo/VideoDemo";
import StoryTimeline from "@/components/constructor/story-timeline/StoryTimeline";
import InfoBlock from "@/components/constructor/Info-block/InfoBlock";

// ------------------- helpers -------------------

function resolveMedia(key?: string) {
    if (!key) return undefined;
    const v = (mediaMap as Record<string, unknown>)[key];
    if (!v && process.env.NODE_ENV !== "production") {
        console.warn(`media asset not found: ${key}`);
    }
    return v as any;
}

// ------------------- renderers -------------------

function RenderCustom(b: CustomBlock) {
    switch (b.component) {
        case "MissionBanner":
            return (
                <MissionBanner
                    title={b.title}
                    description={b.description}
                    image={b.image ? resolveMedia(b.image) : undefined}
                />
            );

        case "HighlightStrip":
            return <HighlightStrip items={b.items ?? []} />;

        case "Marquee":
            return <Marquee items={b.items ?? []} />;

        case "Timeline":
            return <Timeline title={b.title} steps={b.steps ?? []} />;


        case "ContactForm":
            return <ContactUsForm />;

        case "LogoBlock":
            return <LogoBlock width={b.width} height={b.height} />;

        case "ValuesIcons":
            return (
                <ValuesIcons
                    title={b.title}
                    description={b.description}
                    values={b.values ?? []}
                />
            );

        case "VideoDemo":
            return (
                <VideoDemo
                    title={b.title}
                    description={b.description}
                    video={b.video}
                />
            );

        case "TeamGrid":
            return (
                <TeamGrid
                    title={b.title}
                    description={b.description}
                    members={b.members ?? []}
                />
            );

        case "TestimonialsSlider":
            return (
                <TestimonialsSlider
                    title={b.title}
                    description={b.description}
                    testimonials={b.testimonials}
                />
            );


        case "StoryTimeline":
            return <StoryTimeline steps={b.steps ?? []} />;

        case "InfoBlock":
            return (
                <InfoBlock
                    title={b.title}
                    description={b.description}
                    icon={b.icon}
                    image={b.image ? resolveMedia(b.image) : undefined}
                    bullets={b.bullets}
                    align={b.align}
                    buttonText={b.buttonText}
                    buttonLink={b.buttonLink}
                />
            );


        case "HeroSection":
            return (
                <HeroSection
                    title={b.title}
                    highlight={b.highlight}
                    description={b.description}
                    primaryCta={b.primaryCta}
                    secondaryCta={b.secondaryCta}
                    image={b.image}
                    align={b.align} // ➕ передаємо напрям
                />
            );

        default:
            return null;
    }
}

function RenderText(b: TextBlock) {
    return (
        <Text
            title={b.title}
            description={b.description}
            bullets={b.bullets}
            centerTitle={b.centerTitle}
            centerDescription={b.centerDescription}
            centerBullets={b.centerBullets}
        />
    );
}

function RenderMedia(b: MediaBlock) {
    return (
        <Media
            src={resolveMedia(b.src)}
            type={b.mediaType}
            width={b.width}
            height={b.height}
            alt={b.alt}
            controls={b.controls}
            loop={b.loop}
            autoPlay={b.autoPlay}
            muted={b.muted}
        />
    );
}

function RenderSlider(b: SliderBlock) {
    return <Slider images={b.images.map(resolveMedia)} />;
}

function RenderFaq(b: FaqBlock) {
    return <FAQ items={b.items} image={b.image ? resolveMedia(b.image) : undefined} />;
}

function RenderCard(b: CardBlock) {
    return (
        <Card
            image={resolveMedia(b.image)}
            title={b.title}
            description={b.description}
            buttonLink={b.buttonLink}
            buttonText={b.buttonText}
        />
    );
}

function RenderPricingCard(b: PricingBlock) {
    return (
        <PricingCard
            variant={b.variant}
            title={b.title}
            price={b.price}
            tokens={b.tokens}
            description={b.description}
            features={b.features}
            buttonText={b.buttonText}
            buttonLink={b.buttonLink}
            badgeTop={b.badgeTop}
            badgeBottom={b.badgeBottom}е
        />
    );
}

// ------------------- grid + section -------------------

function mapAlign(a?: AlignInput): "center" | "start" | "end" | undefined {
    if (!a) return undefined;
    if (a === "left") return "start";
    if (a === "right") return "end";
    return a;
}

function RenderSection(b: SectionBlock) {
    const left = b.left ? renderBlock(b.left, "left") : undefined;
    const right = b.right ? renderBlock(b.right, "right") : undefined;
    return (
        <Section
            title={b.title}
            description={b.description}
            align={mapAlign(b.align)}
            gap={b.gap}
            left={left}
            right={right}
        />
    );
}

function RenderGrid(b: GridBlock) {
    const items: GridItem[] =
        b.items && b.items.length > 0
            ? b.items
            : b.cards?.map((c, idx) => {
            if (c.type === "pricing") {
                return {
                    key: c.title ?? String(idx),
                    block: c as PricingBlock,
                };
            }
            return {
                key: c.title ?? String(idx),
                block: {
                    type: "card",
                    image: c.image,
                    title: c.title,
                    description: c.description,
                    buttonLink: c.buttonLink,
                    buttonText: c.buttonText,
                } as CardBlock,
            };
        }) ?? [];

    return (
        <Grid columns={b.columns} gap={b.gap} style={b.style}>
            {items.map((item, i) => (
                <div
                    key={item.key ?? i}
                    style={item.colSpan ? { gridColumn: `span ${item.colSpan}` } : undefined}
                >
                    {renderBlock(item.block, item.key ?? i)}
                </div>
            ))}
        </Grid>
    );
}

// ------------------- switch -------------------

function renderBlock(block: PageBlock, key?: React.Key): React.ReactNode {
    switch (block.type) {
        case "text":
            return <RenderText key={key} {...block} />;
        case "media":
            return <RenderMedia key={key} {...block} />;
        case "slider":
            return <RenderSlider key={key} {...block} />;
        case "faq":
            return <RenderFaq key={key} {...block} />;
        case "card":
            return <RenderCard key={key} {...block} />;
        case "pricing":
            return <RenderPricingCard key={key} {...block} />;
        case "section":
            return <RenderSection key={key} {...block} />;
        case "grid":
            return <RenderGrid key={key} {...block} />;
        case "custom":
            return <RenderCustom key={key} {...block} />;
        default: {
            const _exhaustive: never = block;
            return _exhaustive;
        }
    }
}

// ------------------- root -------------------

export default function PageRenderer({ schema }: { schema: PageSchema }) {
    return <>{schema.blocks.map((b, i) => renderBlock(b, i))}</>;
}
