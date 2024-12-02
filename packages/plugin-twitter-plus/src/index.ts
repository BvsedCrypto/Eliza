import { TwitterPostClient } from "./post.ts";
import { TwitterSearchClient } from "./search.ts";
import { TwitterInteractionClient } from "./interactions.ts";
import { IAgentRuntime, Client, elizaLogger } from "@ai16z/eliza";
import { validateTwitterConfig, TwitterFullConfig } from "./enviroment";
import { TemplateEnhancedTwitterClient } from "./template-enhanced-client.ts";
import { readFile } from 'fs/promises';
import { join } from 'path';
import { SpecialInteractions } from "./interactions.ts";

class TwitterManager {
    private client: TemplateEnhancedTwitterClient;
    private post: TwitterPostClient;
    private search: TwitterSearchClient;
    private interaction: TwitterInteractionClient;
    private config: TwitterFullConfig;

    constructor(runtime: IAgentRuntime) {
        this.client = new TemplateEnhancedTwitterClient(runtime);
        this.post = new TwitterPostClient(this.client, runtime);
        this.search = new TwitterSearchClient(runtime);
        this.interaction = new TwitterInteractionClient(this.client, runtime);
    }

    private static async findConfigFile(filename: string): Promise<string | undefined> {
        const possiblePaths = [
            join('/app', 'characters', filename),
            join(process.cwd(), '..', 'characters', filename),
            join(process.cwd(), 'characters', filename),
        ];

        for (const path of possiblePaths) {
            try {
                elizaLogger.debug(`Attempting to load ${filename} from:`, path);
                const content = await readFile(path, 'utf-8');
                elizaLogger.debug(`Successfully loaded ${filename} from:`, path);
                return content;
            } catch (e) {
                continue;
            }
        }

        return undefined;
    }

    async initialize(): Promise<void> {
        try {
            // Initialize enhanced client first
            await this.client.init();

            // Load configurations
            await Promise.all([
                this.loadSpecialInteractions(),
                this.loadTemplateConfigurations()
            ]);

            // Start the clients
            await Promise.all([
                this.post.start(),
                this.interaction.start()
            ]);

            elizaLogger.log("Twitter manager initialized successfully");
        } catch (error) {
            elizaLogger.error("Failed to initialize Twitter manager:", error);
            throw error;
        }
    }

    async loadSpecialInteractions(): Promise<void> {
        try {
            const fileContent = await TwitterManager.findConfigFile('specialinteractions/specialinteractions.json');

            if (!fileContent) {
                elizaLogger.warn('No special interactions configuration found');
                return;
            }

            const interactions = JSON.parse(fileContent) as SpecialInteractions;

            await this.setupSpecialInteractions(interactions);

            elizaLogger.info(`Successfully loaded ${Object.keys(interactions).length} special interactions`);

        } catch (error) {
            elizaLogger.error('Failed to load special interactions:', {
                message: error instanceof Error ? error.message : String(error),
                type: error?.constructor?.name
            });
        }
    }

    async loadTemplateConfigurations(): Promise<void> {
        try {
            const fileContent = await TwitterManager.findConfigFile('templates/template_config.json');

            if (!fileContent) {
                elizaLogger.warn('No template configuration found, using defaults');
                return;
            }

            const templateConfig = JSON.parse(fileContent);
            await this.client.updateTemplateConfig(templateConfig);

            elizaLogger.info('Successfully loaded template configurations');

        } catch (error) {
            elizaLogger.error('Failed to load template configurations:', {
                message: error instanceof Error ? error.message : String(error),
                type: error?.constructor?.name
            });
        }
    }

    private async setupSpecialInteractions(interactions: SpecialInteractions): Promise<void> {
        // Validate interactions before setting
        for (const [key, interaction] of Object.entries(interactions)) {
            if (!interaction.handle || !interaction.templates || !interaction.probability) {
                elizaLogger.warn(`Invalid special interaction config for ${key}, skipping`);
                delete interactions[key];
                continue;
            }
        }

        // Set up special interactions for both post and interaction clients
        if ('setSpecialInteractions' in this.post) {
            (this.post as any).setSpecialInteractions(interactions);
        }
        if ('setSpecialInteractions' in this.interaction) {
            (this.interaction as any).setSpecialInteractions(interactions);
        }
    }

    async handleError(error: Error): Promise<void> {
        elizaLogger.error("Twitter manager encountered an error:", error);

        // Implement error recovery logic
        if (error.message.includes('rate limit')) {
            await this.handleRateLimit();
        } else if (error.message.includes('authentication')) {
            await this.handleAuthError();
        } else {
            await this.handleGenericError(error);
        }
    }

    private async handleRateLimit(): Promise<void> {
        elizaLogger.warn("Rate limit encountered, implementing backoff strategy");
        // Implement rate limit handling
    }

    private async handleAuthError(): Promise<void> {
        elizaLogger.warn("Authentication error encountered, attempting to refresh");
        // Implement auth error handling
    }

    private async handleGenericError(error: Error): Promise<void> {
        elizaLogger.warn("Generic error encountered:", error);
        // Implement generic error handling
    }

    async cleanup(): Promise<void> {
        try {
            // Implement cleanup logic
            elizaLogger.log("Cleaning up Twitter manager resources");
        } catch (error) {
            elizaLogger.error("Error during cleanup:", error);
        }
    }
}

export const TwitterClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        try {
            // Validate configuration
            const config = await validateTwitterConfig(runtime);
            elizaLogger.log("Twitter configuration validated");

            // Create and initialize manager
            const manager = new TwitterManager(runtime);
            await manager.initialize();

            elizaLogger.log("Twitter client started successfully");
            return manager;

        } catch (error) {
            elizaLogger.error("Failed to start Twitter client:", error);
            throw error;
        }
    },

    async stop(runtime: IAgentRuntime) {
        try {
            elizaLogger.warn("Stopping Twitter client");
            // Implement proper shutdown logic
            await runtime.cacheManager.set('twitter/shutdown_status', {
                timestamp: Date.now(),
                status: 'clean_shutdown'
            });
        } catch (error) {
            elizaLogger.error("Error during Twitter client shutdown:", error);
            throw error;
        }
    },
};

export default TwitterClientInterface;
