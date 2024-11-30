export interface Market {
    id: number;
    question: string;
    end: string;
    description: string;
    active: boolean;
    funded: boolean;
    rewardsMinSize: number;
    rewardsMaxSpread: number;
    spread: number;
    outcomes: string;
    outcome_prices: string;
    clob_token_ids: string;
  }