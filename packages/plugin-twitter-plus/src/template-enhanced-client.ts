import {
    IAgentRuntime,
    Content,
    Memory,
    elizaLogger,
    ModelClass,
    State,
    embeddingZeroVector,
    stringToUuid
} from "@ai16z/eliza";
import { composeContext, generateMessageResponse, generateShouldRespond } from "@ai16z/eliza";
import { TwitterTemplateManager } from './template-manager.ts';
import { ClientBase } from "./base.ts";
import { Tweet } from "agent-twitter-client";
import { twitterMessageHandlerTemplate, twitterShouldRespondTemplate } from './templates.ts';

export class TemplateEnhancedTwitterClient extends ClientBase {
    private templateManager: TwitterTemplateManager;
    private lastGeneratedContent: Record<string, { timestamp: number; content: string }> = {};

    constructor(runtime: IAgentRuntime) {
        super(runtime);
        this.templateManager = new TwitterTemplateManager(runtime);
    }

    async init() {
        await super.init();
        await this.templateManager.initialize();
    }

    protected async generateTweetContent(context: any = {}): Promise<string> {
        try {
            // Avoid duplicate content within a short timeframe
            const dedupeKey = JSON.stringify({
                isReply: context.isReply,
                currentPost: context.currentPost?.slice(0, 50)
            });

            const lastGenerated = this.lastGeneratedContent[dedupeKey];
            if (lastGenerated && Date.now() - lastGenerated.timestamp < 60000) {
                elizaLogger.debug("Using recently generated content to avoid duplication");
                return lastGenerated.content;
            }

            const templateType = await this.determineTemplateType(context);
            const template = await this.getEnhancedTemplate(templateType, context);

            // Determine if we should respond at all
            if (context.isReply) {
                const shouldRespond = await this.shouldRespond(context);
                if (shouldRespond !== "RESPOND") {
                    return "";
                }
            }

            // Generate content using the template
            const generatedContent = await this.generateFromTemplate(template, context);
            const formattedContent = this.templateManager.formatTweet(generatedContent);

            // Cache the generated content
            this.lastGeneratedContent[dedupeKey] = {
                timestamp: Date.now(),
                content: formattedContent
            };

            return formattedContent;
        } catch (error) {
            elizaLogger.error("Error generating tweet content:", error);
            throw error;
        }
    }

    private async shouldRespond(context: any): Promise<string> {
        const shouldRespondContext = composeContext({
            state: await this.prepareContext(twitterShouldRespondTemplate, context),
            template: twitterShouldRespondTemplate
        });

        return generateShouldRespond({
            runtime: this.runtime,
            context: shouldRespondContext,
            modelClass: ModelClass.SMALL
        });
    }

    private async determineTemplateType(context: any): Promise<string> {
        // First check for special conditions
        if (context.isReply) {
            const responseType = await this.analyzeResponseType(context);
            if (responseType) return responseType;
        }

        // Then check for time-based patterns
        const timeBasedType = this.getTimeBasedTemplateType();
        if (timeBasedType) return timeBasedType;

        // Finally, select based on content analysis
        return this.selectTemplateByContent(context);
    }

    private async analyzeResponseType(context: any): Promise<string | null> {
        const content = context.currentPost?.toLowerCase() || '';
        const thread = context.thread || [];

        // Check for engagement patterns
        if (thread.length > 3) return 'conversation';
        if (content.includes('?')) return 'question';
        if (this.detectDebate(thread)) return 'debate';
        if (this.detectCriticism(content)) return 'defense';

        // Specific content triggers
        if (content.includes('unbeliever')) return 'roast';
        if (content.includes('believe')) return 'recruitment';
        if (content.match(/when.*moon|price|pump/i)) return 'prophecy';

        return null;
    }

    private detectDebate(thread: Tweet[]): boolean {
        // Look for back-and-forth pattern
        const uniqueUsers = new Set(thread.map(t => t.userId));
        return thread.length >= 4 && uniqueUsers.size <= 3;
    }

    private detectCriticism(content: string): boolean {
        const criticismPatterns = [
            'fake', 'scam', 'ponzi', 'worthless', 'garbage',
            'waste', 'stupid', 'bad', 'awful', 'terrible'
        ];
        return criticismPatterns.some(pattern => content.includes(pattern));
    }

    private getTimeBasedTemplateType(): string {
        const hour = new Date().getHours();

        // Night prophecies (8 PM - 4 AM)
        if (hour >= 20 || hour <= 4) return 'prophecy';

        // Morning motivation (5 AM - 9 AM)
        if (hour >= 5 && hour <= 9) return 'motivation';

        // Mid-day engagement (10 AM - 4 PM)
        if (hour >= 10 && hour <= 16) return 'engagement';

        // Evening recruitment (5 PM - 7 PM)
        if (hour >= 17 && hour <= 19) return 'recruitment';

        return 'general';
    }

    private selectTemplateByContent(context: any): string {
        const types = ['prophecy', 'recruitment', 'wisdom', 'celebration', 'humor'];

        // Select template based on moon phases for extra meme value
        const moonPhase = this.getMoonPhase();
        if (moonPhase === 'full') return 'prophecy';
        if (moonPhase === 'new') return 'wisdom';

        return types[Math.floor(Math.random() * types.length)];
    }

    private getMoonPhase(): string {
        // Simple moon phase calculation for memes
        const date = new Date();
        const day = Math.floor((date.getTime() - new Date(2000, 0, 6).getTime()) / (1000 * 60 * 60 * 24));
        const phase = ((day % 29.5) / 29.5) * 100;

        if (phase < 5 || phase > 95) return 'new';
        if (phase > 45 && phase < 55) return 'full';
        return 'other';
    }

    private async getEnhancedTemplate(type: string, context: any): Promise<string> {
        const templateVariation = this.templateManager.getTemplate(type, context);

        if (templateVariation) {
            return templateVariation.template;
        }

        // Fallback to default templates if no match
        return context.isReply ?
            twitterMessageHandlerTemplate :
            twitterShouldRespondTemplate;
    }

    protected async generateFromTemplate(template: string, context: any): Promise<string> {
        const enhancedContext = await this.prepareContext(template, context);

        const response = await generateMessageResponse({
            runtime: this.runtime,
            context: composeContext({
                state: enhancedContext,
                template: template
            }),
            modelClass: context.modelClass || "MEDIUM"
        });

        return response.text;
    }

    private async prepareContext(template: string, context: any): Promise<State> {
        const recentPosts = await this.getRecentPosts();
        const interactions = await this.getRecentInteractions();
        const marketContext = await this.getMarketContext();

        const baseContext = await this.runtime.composeState(context.message || {}, {
            twitterClient: this.twitterClient,
            twitterUserName: this.runtime.getSetting("TWITTER_USERNAME"),
            currentPost: context.currentPost,
            formattedConversation: context.formattedConversation,
            recentPosts,
            interactions,
            marketContext,
            templateType: context.templateType,
            timeOfDay: new Date().getHours(),
            moonPhase: this.getMoonPhase(),
            ...context
        });

        return {
            ...baseContext,
            ...context,
            template
        };
    }

    private async getRecentPosts(limit: number = 10): Promise<string[]> {
        try {
            const timeline = await this.getCachedTimeline();
            return timeline?.slice(0, limit).map(tweet => tweet.text) || [];
        } catch (error) {
            elizaLogger.error("Error getting recent posts:", error);
            return [];
        }
    }

    private async getRecentInteractions(limit: number = 5): Promise<any[]> {
        try {
            const mentions = await this.fetchSearchTweets(
                `@${this.profile.username}`,
                limit,
                'Latest'
            );
            return mentions.tweets || [];
        } catch (error) {
            elizaLogger.error("Error getting recent interactions:", error);
            return [];
        }
    }

    private async getMarketContext(): Promise<any> {
        // Placeholder for market context - could be expanded with real data
        return {
            marketMood: this.getMoonPhase() === 'full' ? 'bullish' : 'building',
            trending: true,
            phase: 'accumulation'
        };
    }

    public async handleTweet(params: {
        tweet: Tweet,
        message: Memory,
        thread: Tweet[],
        context?: any
    }): Promise<{text: string, action: string}> {
        const { tweet, message, thread, context = {} } = params;

        try {
            const tweetContext = {
                isReply: !!tweet.inReplyToStatusId,
                message,
                thread,
                currentPost: tweet.text,
                formattedConversation: thread.map(t => t.text).join('\n'),
                timeOfDay: new Date().getHours(),
                ...context
            };

            const content = await this.generateTweetContent(tweetContext);

            if (!content) {
                elizaLogger.debug("No content generated");
                return { text: "", action: "IGNORE" };
            }

            // Track this interaction
            await this.trackInteraction(tweet);

            elizaLogger.debug("Generated content:", content);
            return { text: content, action: "RESPOND" };

        } catch (error) {
            elizaLogger.error("Error handling tweet:", error);
            return { text: "", action: "ERROR" };
        }
    }

    private async trackInteraction(tweet: Tweet): Promise<void> {
        const interactionKey = `interaction:${tweet.id}`;
        await this.runtime.cacheManager.set(interactionKey, {
            timestamp: Date.now(),
            userId: tweet.userId,
            type: tweet.inReplyToStatusId ? 'reply' : 'mention'
        });
    }

    public async updateTemplateConfig(newConfig: Partial<any>): Promise<void> {
        try {
            await this.templateManager.updateConfig(newConfig);
            elizaLogger.debug("Template configuration updated");
        } catch (error) {
            elizaLogger.error("Error updating template configuration:", error);
            throw error;
        }
    }
}
