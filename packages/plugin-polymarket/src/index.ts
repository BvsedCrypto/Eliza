import { Plugin } from "@ai16z/eliza";
import dotenv from 'dotenv';
import { buildOrder } from "./actions/buildOrder";
import { executeMarketOrder } from "./actions/executeMarketOrder";
import { walletProvider } from "./providers/wallet";
import { eventsProvider } from "./providers/events";
import { marketsProvider } from "./providers/markets";
import { ordersProvider } from "./providers/orders";
dotenv.config();

const polymarketPlugin: Plugin = {
  name: "polymarket-plugin",
  description: "Plugin for interacting with Polymarket prediction markets",
  actions: [buildOrder, executeMarketOrder],
  evaluators: [],
  providers: [walletProvider, eventsProvider, ordersProvider, marketsProvider],
  services: [],
};

export default polymarketPlugin;