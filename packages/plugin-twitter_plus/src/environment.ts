import { IAgentRuntime } from "@ai16z/eliza";
import { z } from "zod";

// Base Twitter configuration schema
export const twitterEnvSchema = z.object({
    TWITTER_DRY_RUN: z
        .string()
        .transform((val) => val.toLowerCase() === "true"),
    TWITTER_USERNAME: z.string().min(1, "Twitter username is required"),
    TWITTER_PASSWORD: z.string().min(1, "Twitter password is required"),
    TWITTER_EMAIL: z.string().email("Valid Twitter email is required"),
    TWITTER_COOKIES: z.string().optional(),
    TWITTER_2FA_SECRET: z.string().optional(),
});

// Posting behavior configuration
export const postingConfigSchema = z.object({
    POST_INTERVAL_MIN: z.number().min(1).default(90),
    POST_INTERVAL_MAX: z.number().min(1).default(180),
    POST_IMMEDIATELY: z.boolean().default(false),
    MAX_POSTS_PER_DAY: z.number().min(1).default(48),
    REQUIRE_APPROVAL: z.boolean().default(false)
});

// Interaction limits configuration
export const interactionConfigSchema = z.object({
    MAX_REPLIES_PER_THREAD: z.number().min(1).default(3),
    MAX_REPLIES_PER_USER: z.number().min(1).default(5),
    MIN_TIME_BETWEEN_REPLIES: z.number().min(1000).default(300000),
    CHECK_INTERVAL_MINUTES: z.number().min(1).default(3),
    REPLY_PROBABILITY: z.number().min(0).max(1).default(0.5)
});

// Special interaction configuration
export const specialInteractionSchema = z.object({
    handle: z.string(),
    topics: z.array(z.string()),
    templates: z.array(z.string()),
    probability: z.number().min(0).max(1),
    cooldown: z.number().optional().default(86400000) // 24 hours in milliseconds
});

export const specialInteractionsConfigSchema = z.record(specialInteractionSchema);

// Template customization
export const templateConfigSchema = z.object({
    TEMPLATE_CONFIG_PATH: z.string().optional(),
    CUSTOM_TEMPLATES_ENABLED: z.boolean().default(true),
    DEFAULT_TEMPLATE_TYPE: z.string().default("general"),
    TEMPLATE_CACHE_DURATION: z.number().default(3600000) // 1 hour in milliseconds
});

// Combined configuration schema
export const twitterFullConfigSchema = z.object({
    twitter: twitterEnvSchema,
    posting: postingConfigSchema,
    interaction: interactionConfigSchema,
    specialInteractions: specialInteractionsConfigSchema.optional(),
    templates: templateConfigSchema
});

// Type definitions
export type TwitterConfig = z.infer<typeof twitterEnvSchema>;
export type PostingConfig = z.infer<typeof postingConfigSchema>;
export type InteractionConfig = z.infer<typeof interactionConfigSchema>;
export type SpecialInteraction = z.infer<typeof specialInteractionSchema>;
export type TemplateConfig = z.infer<typeof templateConfigSchema>;
export type TwitterFullConfig = z.infer<typeof twitterFullConfigSchema>;

// Configuration validator
export async function validateTwitterConfig(
    runtime: IAgentRuntime
): Promise<TwitterFullConfig> {
    try {
        // Collect all configuration values
        const config = {
            twitter: {
                TWITTER_DRY_RUN: runtime.getSetting("TWITTER_DRY_RUN") || process.env.TWITTER_DRY_RUN,
                TWITTER_USERNAME: runtime.getSetting("TWITTER_USERNAME") || process.env.TWITTER_USERNAME,
                TWITTER_PASSWORD: runtime.getSetting("TWITTER_PASSWORD") || process.env.TWITTER_PASSWORD,
                TWITTER_EMAIL: runtime.getSetting("TWITTER_EMAIL") || process.env.TWITTER_EMAIL,
                TWITTER_COOKIES: runtime.getSetting("TWITTER_COOKIES") || process.env.TWITTER_COOKIES,
                TWITTER_2FA_SECRET: runtime.getSetting("TWITTER_2FA_SECRET") || process.env.TWITTER_2FA_SECRET,
            },
            posting: {
                POST_INTERVAL_MIN: parseInt(runtime.getSetting("POST_INTERVAL_MIN") || "90"),
                POST_INTERVAL_MAX: parseInt(runtime.getSetting("POST_INTERVAL_MAX") || "180"),
                POST_IMMEDIATELY: runtime.getSetting("POST_IMMEDIATELY") === "true",
                MAX_POSTS_PER_DAY: parseInt(runtime.getSetting("MAX_POSTS_PER_DAY") || "48"),
                REQUIRE_APPROVAL: runtime.getSetting("REQUIRE_APPROVAL") === "true"
            },
            interaction: {
                MAX_REPLIES_PER_THREAD: parseInt(runtime.getSetting("MAX_REPLIES_PER_THREAD") || "3"),
                MAX_REPLIES_PER_USER: parseInt(runtime.getSetting("MAX_REPLIES_PER_USER") || "5"),
                MIN_TIME_BETWEEN_REPLIES: parseInt(runtime.getSetting("MIN_TIME_BETWEEN_REPLIES") || "300000"),
                CHECK_INTERVAL_MINUTES: parseInt(runtime.getSetting("CHECK_INTERVAL_MINUTES") || "3"),
                REPLY_PROBABILITY: parseFloat(runtime.getSetting("REPLY_PROBABILITY") || "0.5")
            },
            templates: {
                TEMPLATE_CONFIG_PATH: runtime.getSetting("TEMPLATE_CONFIG_PATH"),
                CUSTOM_TEMPLATES_ENABLED: runtime.getSetting("CUSTOM_TEMPLATES_ENABLED") !== "false",
                DEFAULT_TEMPLATE_TYPE: runtime.getSetting("DEFAULT_TEMPLATE_TYPE") || "general",
                TEMPLATE_CACHE_DURATION: parseInt(runtime.getSetting("TEMPLATE_CACHE_DURATION") || "3600000")
            }
        };

        // Try to load special interactions from runtime settings
        try {
            const specialInteractionsStr = runtime.getSetting("TWITTER_SPECIAL_INTERACTIONS");
            if (specialInteractionsStr) {
                config['specialInteractions'] = JSON.parse(specialInteractionsStr);
            }
        } catch (error) {
            // If special interactions can't be parsed, continue without them
            console.warn("Failed to parse special interactions config:", error);
        }

        return twitterFullConfigSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Twitter configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}

// Helper function to get default config values
export function getDefaultConfig(): TwitterFullConfig {
    return {
        twitter: {
            TWITTER_DRY_RUN: false,
            TWITTER_USERNAME: "",
            TWITTER_PASSWORD: "",
            TWITTER_EMAIL: "",
            TWITTER_COOKIES: undefined,
            TWITTER_2FA_SECRET: undefined
        },
        posting: {
            POST_INTERVAL_MIN: 90,
            POST_INTERVAL_MAX: 180,
            POST_IMMEDIATELY: false,
            MAX_POSTS_PER_DAY: 48,
            REQUIRE_APPROVAL: false
        },
        interaction: {
            MAX_REPLIES_PER_THREAD: 3,
            MAX_REPLIES_PER_USER: 5,
            MIN_TIME_BETWEEN_REPLIES: 300000,
            CHECK_INTERVAL_MINUTES: 3,
            REPLY_PROBABILITY: 0.5
        },
        templates: {
            CUSTOM_TEMPLATES_ENABLED: true,
            DEFAULT_TEMPLATE_TYPE: "general",
            TEMPLATE_CACHE_DURATION: 3600000
        }
    };
}

// Helper function to merge configurations
export function mergeConfigs(
    base: Partial<TwitterFullConfig>,
    override: Partial<TwitterFullConfig>
): TwitterFullConfig {
    return twitterFullConfigSchema.parse({
        ...base,
        ...override,
        twitter: { ...base.twitter, ...override.twitter },
        posting: { ...base.posting, ...override.posting },
        interaction: { ...base.interaction, ...override.interaction },
        templates: { ...base.templates, ...override.templates },
        specialInteractions: { ...base.specialInteractions, ...override.specialInteractions }
    });
}