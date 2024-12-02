import { SearchMode, Tweet } from "agent-twitter-client";
import {
    composeContext,
    generateMessageResponse,
    generateShouldRespond,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    stringToUuid,
    elizaLogger,
} from "@ai16z/eliza";
import { TemplateEnhancedTwitterClient } from "./template-enhanced-client.ts";
import { buildConversationThread, sendTweet, wait } from "./utils.ts";
import { embeddingZeroVector } from "@ai16z/eliza";

// Special interactions interfaces
export interface SpecialInteraction {
    handle: string;
    topics: string[];
    templates: string[];
    probability: number;
}

export interface SpecialInteractions {
    [key: string]: SpecialInteraction;
}

interface InteractionLimits {
    maxRepliesPerThread: number;
    maxRepliesPerUser: number;
    minTimeBetweenReplies: number;
    checkIntervalMinutes: number;
    replyProbability: number;
}

export class TwitterInteractionClient {
    private client: TemplateEnhancedTwitterClient;
    private runtime: IAgentRuntime;
    private recentReplies: Map<string, number> = new Map();
    private threadReplies: Map<string, number> = new Map();
    private lastReplyTime: Map<string, number> = new Map();
    private limits: InteractionLimits;
    private specialInteractions: SpecialInteractions = {};
    private lastSpecialInteraction: Record<string, number> = {};
    private specialInteractionCooldown: number = 24 * 60 * 60 * 1000;

    constructor(client: TemplateEnhancedTwitterClient, runtime: IAgentRuntime) {
        this.client = client;
        this.runtime = runtime;

        this.limits = {
            maxRepliesPerThread: parseInt(runtime.getSetting("MAX_REPLIES_PER_THREAD")) || 2,
            maxRepliesPerUser: parseInt(runtime.getSetting("MAX_REPLIES_PER_USER")) || 5,
            minTimeBetweenReplies: parseInt(runtime.getSetting("MIN_TIME_BETWEEN_REPLIES")) || 300000,
            checkIntervalMinutes: parseInt(runtime.getSetting("CHECK_INTERVAL_MINUTES")) || 3,
            replyProbability: parseFloat(runtime.getSetting("REPLY_PROBABILITY")) || 0.5
        };

        setInterval(() => this.cleanupTrackingMaps(), 24 * 60 * 60 * 1000);
    }

    public setSpecialInteractions(interactions: SpecialInteractions): void {
        this.specialInteractions = interactions;
        Object.keys(this.specialInteractions).forEach(key => {
            this.lastSpecialInteraction[key] = 0;
        });
    }

    public async start(): Promise<void> {
        const handleInteractions = async () => {
            await this.handleTwitterInteractions();
            setTimeout(
                handleInteractions,
                this.limits.checkIntervalMinutes * 60 * 1000
            );
        };

        await handleInteractions();
    }

    private cleanupTrackingMaps() {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        // Clean up user tracking
        for (const [userId, timestamp] of this.lastReplyTime) {
            if (timestamp < oneDayAgo) {
                this.lastReplyTime.delete(userId);
                this.recentReplies.delete(userId);
            }
        }
        this.threadReplies.clear();

        // Clean up special interaction tracking
        for (const key in this.lastSpecialInteraction) {
            if (this.lastSpecialInteraction[key] < oneDayAgo) {
                delete this.lastSpecialInteraction[key];
            }
        }
    }

    private canReplyToUser(userId: string): boolean {
        const replyCount = this.recentReplies.get(userId) || 0;
        const lastReplyTime = this.lastReplyTime.get(userId) || 0;
        const timeSinceLastReply = Date.now() - lastReplyTime;

        return (
            replyCount < this.limits.maxRepliesPerUser &&
            timeSinceLastReply >= this.limits.minTimeBetweenReplies
        );
    }

    private canReplyInThread(conversationId: string): boolean {
        const threadReplyCount = this.threadReplies.get(conversationId) || 0;
        return threadReplyCount < this.limits.maxRepliesPerThread;
    }

    private async handleTwitterInteractions() {
        elizaLogger.log("Checking Twitter interactions");

        try {
            const tweetCandidates = await this.fetchAndFilterTweets();

            for (const tweet of tweetCandidates) {
                await this.processTweetCandidate(tweet);
            }

            await this.client.cacheLatestCheckedTweetId();
            elizaLogger.log("Finished checking Twitter interactions");

        } catch (error) {
            elizaLogger.error("Error handling Twitter interactions:", error);
        }
    }

    private async fetchAndFilterTweets(): Promise<Tweet[]> {
        const twitterUsername = this.client.profile.username;
        const tweetCandidates = (
            await this.client.fetchSearchTweets(
                `@${twitterUsername}`,
                20,
                SearchMode.Latest
            )
        ).tweets;

        return [...new Set(tweetCandidates)]
            .sort((a, b) => a.id.localeCompare(b.id))
            .filter((tweet) => tweet.userId !== this.client.profile.id);
    }

    private async processTweetCandidate(tweet: Tweet) {
        if (
            !this.client.lastCheckedTweetId ||
            BigInt(tweet.id) > this.client.lastCheckedTweetId
        ) {
            if (!this.shouldProcessTweet(tweet)) {
                return;
            }

            await this.processSingleTweet(tweet);
            this.client.lastCheckedTweetId = BigInt(tweet.id);
        }
    }

    private shouldProcessTweet(tweet: Tweet): boolean {
        if (!this.canReplyToUser(tweet.userId) ||
            !this.canReplyInThread(tweet.conversationId)) {
            elizaLogger.log("Skipping tweet due to rate limits", tweet.permanentUrl);
            return false;
        }

        if (Math.random() > this.limits.replyProbability) {
            elizaLogger.log("Skipping tweet due to probability check", tweet.permanentUrl);
            return false;
        }

        return true;
    }

    private async processSingleTweet(tweet: Tweet) {
        elizaLogger.log("Processing new tweet:", tweet.permanentUrl);

        const { roomId, userIdUUID } = await this.setupTweetContext(tweet);
        const thread = await buildConversationThread(tweet, this.client);

        const message = {
            content: { text: tweet.text },
            agentId: this.runtime.agentId,
            userId: userIdUUID,
            roomId,
        };

        const result = await this.client.handleTweet({
            tweet,
            message,
            thread,
            context: {
                limits: this.limits,
                specialInteractions: this.specialInteractions,
                recentReplies: this.recentReplies,
                threadReplies: this.threadReplies,
                lastSpecialInteraction: this.lastSpecialInteraction
            }
        });

        if (result?.action === "RESPOND") {
            this.updateInteractionTracking(tweet.userId, tweet.conversationId);
        }
    }

    private async setupTweetContext(tweet: Tweet) {
        const roomId = stringToUuid(
            tweet.conversationId + "-" + this.runtime.agentId
        );

        const userIdUUID =
            tweet.userId === this.client.profile.id
                ? this.runtime.agentId
                : stringToUuid(tweet.userId!);

        await this.runtime.ensureConnection(
            userIdUUID,
            roomId,
            tweet.username,
            tweet.name,
            "twitter"
        );

        return { roomId, userIdUUID };
    }

    private updateInteractionTracking(userId: string, conversationId: string) {
        const currentReplies = this.recentReplies.get(userId) || 0;
        this.recentReplies.set(userId, currentReplies + 1);

        const currentThreadReplies = this.threadReplies.get(conversationId) || 0;
        this.threadReplies.set(conversationId, currentThreadReplies + 1);

        this.lastReplyTime.set(userId, Date.now());
    }

    async buildConversationThread(
        tweet: Tweet,
        maxReplies: number = this.limits.maxRepliesPerThread
    ): Promise<Tweet[]> {
        const thread: Tweet[] = [];
        const visited: Set<string> = new Set();

        const processThread = async (currentTweet: Tweet, depth: number = 0) => {
            if (!currentTweet || depth >= maxReplies || visited.has(currentTweet.id)) {
                return;
            }

            await this.processThreadTweet(currentTweet, thread, visited);

            if (currentTweet.inReplyToStatusId) {
                try {
                    const parentTweet = await this.client.getTweet(currentTweet.inReplyToStatusId);
                    if (parentTweet) {
                        await processThread(parentTweet, depth + 1);
                    }
                } catch (error) {
                    elizaLogger.error("Error fetching parent tweet:", error);
                }
            }
        };

        await processThread(tweet, 0);
        return thread;
    }

    private async processThreadTweet(tweet: Tweet, thread: Tweet[], visited: Set<string>) {
        const memory = await this.runtime.messageManager.getMemoryById(
            stringToUuid(tweet.id + "-" + this.runtime.agentId)
        );

        if (!memory) {
            await this.createMemoryForThreadTweet(tweet);
        }

        visited.add(tweet.id);
        thread.unshift(tweet);
    }

    private async createMemoryForThreadTweet(tweet: Tweet) {
        const roomId = stringToUuid(tweet.conversationId + "-" + this.runtime.agentId);
        const userId = stringToUuid(tweet.userId);

        await this.runtime.ensureConnection(
            userId,
            roomId,
            tweet.username,
            tweet.name,
            "twitter"
        );

        await this.runtime.messageManager.createMemory({
            id: stringToUuid(tweet.id + "-" + this.runtime.agentId),
            agentId: this.runtime.agentId,
            content: {
                text: tweet.text,
                source: "twitter",
                url: tweet.permanentUrl,
                inReplyTo: tweet.inReplyToStatusId
                    ? stringToUuid(tweet.inReplyToStatusId + "-" + this.runtime.agentId)
                    : undefined,
            },
            createdAt: tweet.timestamp * 1000,
            roomId,
            userId: tweet.userId === this.client.profile.id
                ? this.runtime.agentId
                : stringToUuid(tweet.userId),
            embedding: embeddingZeroVector,
        });
    }
}

export default TwitterInteractionClient;
