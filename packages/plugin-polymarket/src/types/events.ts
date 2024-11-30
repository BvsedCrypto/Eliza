export interface Event {
    id: number;
    ticker: string;
    slug: string;
    title: string;
    description: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    featured: boolean;
    restricted: boolean;
    end: string;
    markets: string;
  }

export const PROVIDER_CONFIG = {
    GAMMA_API: 'https://gamma-api.polymarket.com',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};