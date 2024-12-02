import { IAgentRuntime, elizaLogger } from "@ai16z/eliza";
import { join } from 'path';
import { readFile } from 'fs/promises';

interface HashtagConfig {
    enabled: boolean;
    maxHashtagsPerTweet: number;
    hashtagProbability: number;
    preferredHashtags: string[];
    distributeHashtags: boolean;
}

interface EmojiConfig {
    enabled: boolean;
    maxEmojisPerTweet: number;
    emojiProbability: number;
    allowedEmojis: string[];
    distributeEmojis: boolean;
}

interface StyleConfig {
    tonePreferences: {
        [key: string]: number;  // Probability 0-1 for each tone
    };
    contentThemes: {
        [key: string]: boolean;
    };
    languagePatterns: {
        [key: string]: boolean;
    };
}

interface EngagementRules {
    responsePatterns: {
        maxRepliesPerThread: number;
        maxRepliesPerUser: number;
        minWordsPerTweet: number;
        maxWordsPerTweet: number;
    };
    triggers: {
        mentions: boolean;
        replies: boolean;
        keywords: string[];
        hashtags: string[];
        topics: string[];
    };
    avoidance: {
        shortMessages: boolean;
        spamContent: boolean;
        blockedUsers: boolean;
        blockedTopics: string[];
        customRules?: {
            [key: string]: boolean;
        };
    };
}

interface TemplateVariation {
    name: string;
    description?: string;
    conditions?: {
        field: string;
        operator: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'matches';
        value: string | number | RegExp;
    }[];
    probability?: number;
    template: string;
    metadata?: Record<string, any>;
}

interface TemplateConfig {
    name: string;
    version: string;
    style: {
        hashtags: HashtagConfig;
        emojis: EmojiConfig;
        tone: StyleConfig;
    };
    rules: EngagementRules;
    templates: {
        [key: string]: TemplateVariation[];
    };
    customVariables?: Record<string, any>;
}

class ContentFormatter {
    private config: TemplateConfig;
    private recentlyUsedHashtags: Set<string> = new Set();
    private recentlyUsedEmojis: Set<string> = new Set();

    constructor(config: TemplateConfig) {
        this.config = config;
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getHashtags(): string[] {
        const config = this.config.style.hashtags;
        if (!config.enabled || Math.random() > config.hashtagProbability) {
            return [];
        }

        // Get available hashtags excluding recently used ones
        const availableHashtags = config.preferredHashtags.filter(
            tag => !this.recentlyUsedHashtags.has(tag)
        );

        if (availableHashtags.length === 0) {
            this.recentlyUsedHashtags.clear();
            return [];
        }

        const maxTags = config.distributeHashtags 
            ? Math.floor(Math.random() * (config.maxHashtagsPerTweet + 1))
            : config.maxHashtagsPerTweet;

        const selectedTags = this.shuffleArray(availableHashtags)
            .slice(0, maxTags);

        // Track used hashtags
        selectedTags.forEach(tag => {
            this.recentlyUsedHashtags.add(tag);
            // Clear old hashtags if too many are tracked
            if (this.recentlyUsedHashtags.size > 20) {
                this.recentlyUsedHashtags.clear();
            }
        });

        return selectedTags;
    }

    getEmojis(): string[] {
        const config = this.config.style.emojis;
        if (!config.enabled || Math.random() > config.emojiProbability) {
            return [];
        }

        // Get available emojis excluding recently used ones
        const availableEmojis = config.allowedEmojis.filter(
            emoji => !this.recentlyUsedEmojis.has(emoji)
        );

        if (availableEmojis.length === 0) {
            this.recentlyUsedEmojis.clear();
            return [];
        }

        const maxEmojis = config.distributeEmojis
            ? Math.floor(Math.random() * (config.maxEmojisPerTweet + 1))
            : config.maxEmojisPerTweet;

        const selectedEmojis = this.shuffleArray(availableEmojis)
            .slice(0, maxEmojis);

        // Track used emojis
        selectedEmojis.forEach(emoji => {
            this.recentlyUsedEmojis.add(emoji);
            // Clear old emojis if too many are tracked
            if (this.recentlyUsedEmojis.size > 20) {
                this.recentlyUsedEmojis.clear();
            }
        });

        return selectedEmojis;
    }

    formatText(text: string): string {
        // Basic text cleaning
        return text
            .replace(/\s+/g, ' ')
            .replace(/[\r\n]+/g, '\n')
            .trim();
    }
}

export class TwitterTemplateManager {
    private config: TemplateConfig;
    private runtime: IAgentRuntime;
    private formatter: ContentFormatter;
    private templateCache: Map<string, TemplateVariation[]> = new Map();
    private lastTemplateUse: Map<string, number> = new Map();

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    async initialize(): Promise<void> {
        try {
            const config = await this.loadConfig();
            this.config = config;
            this.formatter = new ContentFormatter(config);
            elizaLogger.log(`Initialized template manager for ${config.name}`);
        } catch (error) {
            elizaLogger.error("Error initializing template manager:", error);
            throw error;
        }
    }

    private async loadConfig(): Promise<TemplateConfig> {
        // Try loading from multiple possible paths
        const possiblePaths = [
            join('/app', 'characters', 'templates', 'template_config.json'),
            join(process.cwd(), '..', 'characters', 'templates', 'template_config.json'),
            join(process.cwd(), 'characters', 'templates', 'template_config.json'),
        ];

        for (const path of possiblePaths) {
            try {
                const fileContent = await readFile(path, 'utf-8');
                return JSON.parse(fileContent);
            } catch (e) {
                continue;
            }
        }

        // Try loading from cache if file not found
        const cachedConfig = await this.runtime.cacheManager.get<TemplateConfig>('twitter/template_config.json');
        if (cachedConfig) {
            return cachedConfig;
        }

        throw new Error('Could not find template configuration');
    }

    async updateConfig(newConfig: Partial<TemplateConfig>): Promise<void> {
        this.config = {
            ...this.config,
            ...newConfig
        };
        this.formatter = new ContentFormatter(this.config);
        await this.runtime.cacheManager.set('twitter/template_config.json', this.config);
    }

    getTemplate(type: string, context: any): TemplateVariation | null {
        const templates = this.config.templates[type];
        if (!templates) return null;

        // Filter templates based on conditions and probability
        const eligibleTemplates = templates.filter(template => {
            if (this.isTemplateOnCooldown(template.name)) {
                return false;
            }

            if (!template.conditions) {
                return this.checkProbability(template);
            }

            return template.conditions.every(condition => 
                this.evaluateCondition(condition, context)
            ) && this.checkProbability(template);
        });

        if (eligibleTemplates.length === 0) return null;

        // Select template and track usage
        const selected = this.shuffleArray(eligibleTemplates)[0];
        this.trackTemplateUse(selected.name);

        return selected;
    }

    private isTemplateOnCooldown(templateName: string): boolean {
        const lastUse = this.lastTemplateUse.get(templateName);
        if (!lastUse) return false;

        // 5-minute cooldown
        return (Date.now() - lastUse) < 5 * 60 * 1000;
    }

    private trackTemplateUse(templateName: string): void {
        this.lastTemplateUse.set(templateName, Date.now());

        // Clean up old entries
        if (this.lastTemplateUse.size > 100) {
            const oldEntries = Array.from(this.lastTemplateUse.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(50);
            
            oldEntries.forEach(([key]) => this.lastTemplateUse.delete(key));
        }
    }

    private checkProbability(template: TemplateVariation): boolean {
        return !template.probability || Math.random() < template.probability;
    }

    private evaluateCondition(condition: any, context: any): boolean {
        const value = this.getFieldValue(context, condition.field);
        
        switch (condition.operator) {
            case 'contains':
                return String(value).includes(String(condition.value));
            case 'equals':
                return value === condition.value;
            case 'greaterThan':
                return Number(value) > Number(condition.value);
            case 'lessThan':
                return Number(value) < Number(condition.value);
            case 'matches':
                return new RegExp(String(condition.value)).test(String(value));
            default:
                return false;
        }
    }

    private getFieldValue(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }

    private shuffleArray<T>(array: T[]): T[] {
        return [...array].sort(() => Math.random() - 0.5);
    }

    formatTweet(tweet: string): string {
        const hashtags = this.formatter.getHashtags();
        const emojis = this.formatter.getEmojis();
        
        const tweetContent = this.formatter.formatText(tweet);
        const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
        const emojiString = emojis.join(' ');

        return [tweetContent, emojiString, hashtagString]
            .filter(str => str)
            .join(' ')
            .trim();
    }

    // Helper methods for external use
    getTonePreferences(): Record<string, number> {
        return this.config.style.tone.tonePreferences;
    }

    getContentThemes(): string[] {
        return Object.entries(this.config.style.tone.contentThemes)
            .filter(([, enabled]) => enabled)
            .map(([theme]) => theme);
    }

    getLanguagePatterns(): string[] {
        return Object.entries(this.config.style.tone.languagePatterns)
            .filter(([, enabled]) => enabled)
            .map(([pattern]) => pattern);
    }
}