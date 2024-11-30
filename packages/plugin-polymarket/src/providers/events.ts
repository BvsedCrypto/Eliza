import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import NodeCache from "node-cache";
import axios from 'axios';
import { Event, PROVIDER_CONFIG } from '../types/events';

export class EventsProvider {
    private readonly gammaUrl = PROVIDER_CONFIG.GAMMA_API;
    private readonly gammaEventsEndpoint: string;
    private cache: NodeCache;

    constructor() {
        this.gammaEventsEndpoint = `${this.gammaUrl}/events`;
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    private mapApiToEvent(event: any): Event {
        return {
            id: parseInt(event.id),
            ticker: event.ticker,
            slug: event.slug,
            title: event.title,
            description: event.description || '',
            active: event.active,
            closed: event.closed,
            archived: event.archived,
            new: event.new,
            featured: event.featured,
            restricted: event.restricted,
            end: event.endDate,
            markets: event.markets.map((m: any) => m.id).join(','),
        };
    }

    async fetchEvents(runtime: IAgentRuntime): Promise<Event[]> {
        try {
            const cacheKey = 'events';
            const cachedValue = this.cache.get<Event[]>(cacheKey);
            if (cachedValue) return cachedValue;

            const response = await axios.get(this.gammaEventsEndpoint);
            if (response.status === 200) {
                const events = response.data.map((event: any) => this.mapApiToEvent(event));
                this.cache.set(cacheKey, events);
                return events;
            }
            return [];
        } catch (error) {
            console.error("Error fetching events:", error);
            return [];
        }
    }

    async fetchTradeableEvents(runtime: IAgentRuntime): Promise<Event[]> {
        const events = await this.fetchEvents(runtime);
        return events.filter(event =>
            event.active &&
            !event.restricted &&
            !event.archived &&
            !event.closed
        );
    }

    formatEvents(runtime: IAgentRuntime, events: Event[]): string {
        let output = `${runtime.character.name}\n\n`;
        output += "Available Events:\n\n";

        if (events.length === 0) {
            return output + "No events found\n";
        }

        events.forEach(event => {
            output += `Title: ${event.title}\n`;
            output += `ID: ${event.id}\n`;
            output += `Status: ${event.active ? 'Active' : 'Inactive'}\n`;
            output += `End: ${event.end}\n`;
            if (event.description) {
                output += `Description: ${event.description}\n`;
            }
            output += '\n';
        });

        return output;
    }

    async getFormattedEvents(runtime: IAgentRuntime): Promise<string> {
        try {
            const events = await this.fetchEvents(runtime);
            return this.formatEvents(runtime, events);
        } catch (error) {
            console.error("Error generating events report:", error);
            return "Unable to fetch events. Please try again later.";
        }
    }

    async getFormattedTradeableEvents(runtime: IAgentRuntime): Promise<string> {
        try {
            const events = await this.fetchTradeableEvents(runtime);
            return this.formatEvents(runtime, events);
        } catch (error) {
            console.error("Error generating tradeable events report:", error);
            return "Unable to fetch tradeable events. Please try again later.";
        }
    }
}

export const eventsProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        type: 'all' | 'tradeable' = 'all'
    ): Promise<string | null> => {
        try {
            const provider = new EventsProvider();
            return type === 'all'
                ? await provider.getFormattedEvents(runtime)
                : await provider.getFormattedTradeableEvents(runtime);
        } catch (error) {
            console.error("Error in events provider:", error);
            return null;
        }
    },
};