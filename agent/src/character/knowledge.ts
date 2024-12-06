import OpenAI from 'openai';
import {
    UUID,
    KnowledgeItem,
    Content,
    ICacheManager
} from '@ai16z/eliza/src/types';
import { settings } from '@ai16z/eliza/src/settings';
import { PostgresDatabaseAdapter } from "@ai16z/adapter-postgres";
import { elizaLogger } from '@ai16z/eliza';

// Define knowledge type structure
export type KnowledgeType = {
    id: UUID;
    agentId: UUID;
    type: string;
    content: string;
    embedding: number[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

// Define search parameters
export interface KnowledgeSearchParams {
    agentId: UUID;
    query: string;
    type: string;
    threshold?: number;
    limit?: number;
}

// Define cache structure
export interface KnowledgeCache {
    results: KnowledgeItem[];
    timestamp: number;
    query: string;
}

export class KnowledgeLoader {
    private openai: OpenAI;
    private cache: Map<string, KnowledgeCache>;
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(
        private db: PostgresDatabaseAdapter,
        private cacheManager?: ICacheManager
    ) {
        this.openai = new OpenAI({
            apiKey: settings.OPENAI_API_KEY
        });
        this.cache = new Map();
    }

    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            elizaLogger.info('Generating embedding for text:', text.substring(0, 100) + '...');
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text
            });
            return response.data[0].embedding;
        } catch (error) {
            elizaLogger.error('Error generating embedding:', error);
            throw error;
        }
    }

    private getCacheKey(params: KnowledgeSearchParams): string {
        return `knowledge:${params.agentId}:${params.type}:${params.query}`;
    }

    private async getFromCache(key: string): Promise<KnowledgeItem[] | null> {
        // Try memory cache first
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            elizaLogger.info('Retrieved from memory cache:', key);
            return cached.results;
        }

        // Try persistent cache if available
        if (this.cacheManager) {
            const persistentCache = await this.cacheManager.get<KnowledgeCache>(key);
            if (persistentCache && Date.now() - persistentCache.timestamp < this.CACHE_TTL) {
                elizaLogger.info('Retrieved from persistent cache:', key);
                return persistentCache.results;
            }
        }

        return null;
    }

    private async setCache(key: string, results: KnowledgeItem[], query: string): Promise<void> {
        const cacheEntry: KnowledgeCache = {
            results,
            timestamp: Date.now(),
            query
        };

        // Set memory cache
        this.cache.set(key, cacheEntry);

        // Set persistent cache if available
        if (this.cacheManager) {
            await this.cacheManager.set(key, cacheEntry, { expires: this.CACHE_TTL });
        }
    }

    async searchKnowledgeByTypes(
        agentId: UUID,
        query: string,
        types: string[],
        threshold: number = 0.7,
        limit: number = 5
    ): Promise<Record<string, KnowledgeItem[]>> {
        elizaLogger.info('Searching knowledge for:', {
            agentId,
            query,
            types,
            threshold,
            limit
        });

        try {
            const results: Record<string, KnowledgeItem[]> = {};
            const embedding = await this.generateEmbedding(query);

            for (const type of types) {
                const cacheKey = this.getCacheKey({
                    agentId,
                    query,
                    type,
                    threshold,
                    limit
                });

                // Try cache first
                const cachedResults = await this.getFromCache(cacheKey);
                if (cachedResults) {
                    results[type] = cachedResults;
                    continue;
                }

                // Perform database search
                elizaLogger.info('Searching database for type:', type);
                const result = await this.db.query(`
                    WITH vector_matches AS (
                        SELECT id, content, type, metadata,
                               1 - (embedding <-> $1::vector) as similarity
                        FROM knowledge
                        WHERE "agentId" = $2
                        AND type = $3
                        AND 1 - (embedding <-> $1::vector) >= $4
                    )
                    SELECT *
                    FROM vector_matches
                    ORDER BY similarity DESC
                    LIMIT $5
                `, [`[${embedding.join(',')}]`, agentId, type, threshold, limit]);

                const items = result.rows.map(row => ({
                    id: row.id,
                    content: {
                        text: row.content,
                        type: row.type,
                        metadata: row.metadata || {}
                    } as Content
                }));

                // Cache results
                await this.setCache(cacheKey, items, query);
                results[type] = items;

                elizaLogger.info(`Found ${items.length} results for type:`, type);
            }

            return results;
        } catch (error) {
            elizaLogger.error('Error searching knowledge:', error);
            throw error;
        }
    }

    async getKnowledgeByType(
        agentId: UUID,
        type: string,
        limit: number = 5
    ): Promise<KnowledgeItem[]> {
        elizaLogger.info('Getting knowledge by type:', {
            agentId,
            type,
            limit
        });

        try {
            const result = await this.db.query(`
                SELECT *
                FROM knowledge
                WHERE "agentId" = $1
                AND type = $2
                ORDER BY "createdAt" DESC
                LIMIT $3
            `, [agentId, type, limit]);

            return result.rows.map(row => ({
                id: row.id,
                content: {
                    text: row.content,
                    type: row.type,
                    metadata: row.metadata || {}
                }
            }));
        } catch (error) {
            elizaLogger.error('Error getting knowledge by type:', error);
            throw error;
        }
    }

    // Method to add new knowledge
    async addKnowledge(
        agentId: UUID,
        type: string,
        content: string,
        metadata?: Record<string, any>
    ): Promise<UUID> {
        try {
            const embedding = await this.generateEmbedding(content);

            const result = await this.db.query(`
                INSERT INTO knowledge ("agentId", type, content, embedding, metadata)
                VALUES ($1, $2, $3, $4::vector, $5)
                RETURNING id
            `, [agentId, type, content, `[${embedding.join(',')}]`, metadata || {}]);

            return result.rows[0].id;
        } catch (error) {
            elizaLogger.error('Error adding knowledge:', error);
            throw error;
        }
    }

    // Method to clear cache
    clearCache(): void {
        this.cache.clear();
        elizaLogger.info('Knowledge cache cleared');
    }
}