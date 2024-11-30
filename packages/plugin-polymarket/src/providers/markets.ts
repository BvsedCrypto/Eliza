import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import NodeCache from "node-cache";
import axios from 'axios';
import { Market } from '../types/markets';
import { PROVIDER_CONFIG } from '../types/events';

export class MarketsProvider {
    private readonly gammaUrl = PROVIDER_CONFIG.GAMMA_API;
    private readonly gammaMarketsEndpoint: string;
    private cache: NodeCache;

    constructor() {
        this.gammaMarketsEndpoint = `${this.gammaUrl}/markets`;
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    private mapApiToMarket(market: any, tokenId: string = ''): Market {
        return {
            id: parseInt(market.id),
            question: market.question,
            end: market.endDate,
            description: market.description,
            active: market.active,
            funded: market.funded,
            rewardsMinSize: parseFloat(market.rewardsMinSize),
            rewardsMaxSpread: parseFloat(market.rewardsMaxSpread),
            spread: parseFloat(market.spread),
            outcomes: String(market.outcomes),
            outcome_prices: String(market.outcomePrices),
            clob_token_ids: tokenId || String(market.clobTokenIds),
        };
    }

    async fetchMarkets(runtime: IAgentRuntime): Promise<Market[]> {
        try {
            const cacheKey = 'markets';
            const cachedValue = this.cache.get<Market[]>(cacheKey);
            if (cachedValue) return cachedValue;

            const response = await axios.get(this.gammaMarketsEndpoint);
            if (response.status === 200) {
                const markets = response.data.map((market: any) => this.mapApiToMarket(market));
                this.cache.set(cacheKey, markets);
                return markets;
            }
            return [];
        } catch (error) {
            console.error("Error fetching markets:", error);
            return [];
        }
    }

    async fetchMarketByToken(tokenId: string): Promise<Market | null> {
        try {
            const response = await axios.get(this.gammaMarketsEndpoint, {
                params: { clob_token_ids: tokenId }
            });

            if (response.status === 200 && response.data.length > 0) {
                return this.mapApiToMarket(response.data[0], tokenId);
            }
            return null;
        } catch (error) {
            console.error("Error fetching market:", error);
            return null;
        }
    }

    async fetchTradeableMarkets(runtime: IAgentRuntime): Promise<Market[]> {
        const markets = await this.fetchMarkets(runtime);
        return markets.filter(market => market.active);
    }

    formatMarkets(runtime: IAgentRuntime, markets: Market[]): string {
        let output = `${runtime.character.name}\n\n`;
        output += "Available Markets:\n\n";

        if (markets.length === 0) {
            return output + "No markets found\n";
        }

        markets.forEach(market => {
            output += `Question: ${market.question}\n`;
            output += `ID: ${market.id}\n`;
            output += `Status: ${market.active ? 'Active' : 'Inactive'}\n`;
            output += `End: ${market.end}\n`;
            output += `Spread: ${market.spread}%\n`;
            if (market.description) {
                output += `Description: ${market.description}\n`;
            }
            output += '\n';
        });

        return output;
    }

    async getFormattedMarket(runtime: IAgentRuntime, tokenId: string): Promise<string> {
        try {
            const market = await this.fetchMarketByToken(tokenId);
            if (!market) return "Market not found";
            return this.formatMarkets(runtime, [market]);
        } catch (error) {
            console.error("Error generating market report:", error);
            return "Unable to fetch market. Please try again later.";
        }
    }

    async getFormattedTradeableMarkets(runtime: IAgentRuntime): Promise<string> {
        try {
            const markets = await this.fetchTradeableMarkets(runtime);
            return this.formatMarkets(runtime, markets);
        } catch (error) {
            console.error("Error generating tradeable markets report:", error);
            return "Unable to fetch tradeable markets. Please try again later.";
        }
    }

    async getFormattedMarketDetails(runtime: IAgentRuntime, tokenId: string): Promise<string> {
        try {
            const market = await this.fetchMarketByToken(tokenId);
            if (!market) return "Market not found";

            const orderbook = await this.fetchOrderbook(tokenId);

            let output = this.formatMarkets(runtime, [market]);
            output += "\nOrderbook Details:\n";
            output += `Best Bid: ${orderbook?.bids?.[0]?.price || 'N/A'}\n`;
            output += `Best Ask: ${orderbook?.asks?.[0]?.price || 'N/A'}\n`;
            output += `Spread: ${market.spread}%\n`;

            return output;
        } catch (error) {
            console.error("Error generating market details:", error);
            return "Unable to fetch market details. Please try again later.";
        }
    }

    private async fetchOrderbook(tokenId: string): Promise<any> {
        try {
            const response = await axios.get(`${this.gammaUrl}/orderbook/${tokenId}`);
            return response.status === 200 ? response.data : null;
        } catch (error) {
            console.error("Error fetching orderbook:", error);
            return null;
        }
    }
}

export const marketsProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        options?: { tokenId?: string, type?: 'single' | 'tradeable' | 'details' }
    ): Promise<string | null> => {
        try {
            const provider = new MarketsProvider();

            if (options?.type === 'details' && options?.tokenId) {
                return await provider.getFormattedMarketDetails(runtime, options.tokenId);
            }

            if (options?.type === 'single' && options?.tokenId) {
                return await provider.getFormattedMarket(runtime, options.tokenId);
            }

            return await provider.getFormattedTradeableMarkets(runtime);
        } catch (error) {
            console.error("Error in markets provider:", error);
            return null;
        }
    },
};