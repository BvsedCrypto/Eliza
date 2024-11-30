import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import NodeCache from "node-cache";
import axios from 'axios';
import { PROVIDER_CONFIG } from '../types/events';

export class OrdersProvider {
    private readonly gammaUrl = PROVIDER_CONFIG.GAMMA_API;
    private readonly gammaOrderbookEndpoint: string;
    private readonly gammaPriceEndpoint: string;
    private cache: NodeCache;

    constructor() {
        this.gammaOrderbookEndpoint = `${this.gammaUrl}/orderbook`;
        this.gammaPriceEndpoint = `${this.gammaUrl}/price`;
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    async fetchOrderbook(tokenId: string): Promise<any> {
        try {
            const cacheKey = `orderbook-${tokenId}`;
            const cachedValue = this.cache.get(cacheKey);
            if (cachedValue) return cachedValue;

            const response = await axios.get(`${this.gammaOrderbookEndpoint}/${tokenId}`);
            if (response.status === 200) {
                this.cache.set(cacheKey, response.data);
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching orderbook:', error);
            return null;
        }
    }

    async fetchOrderbookPrice(tokenId: string): Promise<number> {
        try {
            const cacheKey = `price-${tokenId}`;
            const cachedValue = this.cache.get<number>(cacheKey);
            if (cachedValue) return cachedValue;

            const response = await axios.get(`${this.gammaPriceEndpoint}/${tokenId}`);
            if (response.status === 200) {
                const price = parseFloat(response.data);
                this.cache.set(cacheKey, price);
                return price;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching price:', error);
            return 0;
        }
    }

    async getFormattedOrderbook(runtime: IAgentRuntime, tokenId: string): Promise<string> {
        try {
            const orderbook = await this.fetchOrderbook(tokenId);
            const price = await this.fetchOrderbookPrice(tokenId);
            return this.formatOrderbook(runtime, orderbook, price);
        } catch (error) {
            console.error("Error generating orderbook report:", error);
            return "Unable to fetch orderbook. Please try again later.";
        }
    }

    async getFormattedOrderbookPrice(runtime: IAgentRuntime, tokenId: string): Promise<string> {
        try {
            const price = await this.fetchOrderbookPrice(tokenId);
            return `Current Price: $${price}`;
        } catch (error) {
            console.error("Error generating price report:", error);
            return "Unable to fetch price. Please try again later.";
        }
    }

    formatOrderbook(runtime: IAgentRuntime, orderbook: any, price: number): string {
        let output = `${runtime.character.name}\n\n`;
        output += `Current Price: $${price}\n\n`;

        if (!orderbook || !orderbook.bids || !orderbook.asks) {
            return output + "No orderbook data available\n";
        }

        output += "Bids:\n";
        orderbook.bids.slice(0, 5).forEach((bid: any) => {
            output += `Price: $${bid.price} | Size: ${bid.size}\n`;
        });

        output += "\nAsks:\n";
        orderbook.asks.slice(0, 5).forEach((ask: any) => {
            output += `Price: $${ask.price} | Size: ${ask.size}\n`;
        });

        return output;
    }
}

export const ordersProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        options?: { tokenId?: string, type?: 'orderbook' | 'price' }
    ): Promise<string | null> => {
        if (!options?.tokenId) return "Token ID is required";

        try {
            const provider = new OrdersProvider();

            if (options?.type === 'price') {
                return await provider.getFormattedOrderbookPrice(runtime, options.tokenId);
            }

            return await provider.getFormattedOrderbook(runtime, options.tokenId);
        } catch (error) {
            console.error("Error in orders provider:", error);
            return null;
        }
    },
};