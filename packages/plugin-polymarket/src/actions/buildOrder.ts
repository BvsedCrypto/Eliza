import { Action, ActionExample, IAgentRuntime, Memory, State } from "@ai16z/eliza";
import { WalletProvider } from "../providers/wallet";

interface BuildOrderOptions {
    marketToken: string;
    amount: number;
    nonce?: string;
    side?: 'BUY' | 'SELL';
    expiration?: string;
}

export const buildOrder: Action = {
    name: "BUILD_ORDER",
    similes: ["CREATE_ORDER", "PREPARE_ORDER", "NEW_ORDER"],
    validate: async (runtime: IAgentRuntime, message: Memory) => true,
    description: "Build a new order for Polymarket trading",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        options?: { [key: string]: unknown }
    ): Promise<boolean> => {
        try {
            const opts = options as unknown as BuildOrderOptions;
            if (!opts?.marketToken || !opts?.amount) {
                throw new Error('Market token and amount are required');
            }

            const walletProvider = new WalletProvider();
            const makerAddress = walletProvider.getAddressForPrivateKey();

            const order = {
                maker: makerAddress,
                tokenId: options.marketToken,
                makerAmount: options.side === 'SELL' ? 0 : options.amount,
                takerAmount: options.side === 'SELL' ? options.amount : 0,
                feeRateBps: '1',
                nonce: options.nonce || Date.now().toString(),
                side: options.side === 'SELL' ? 1 : 0,
                expiration: options.expiration || '0',
            };

            console.log('Order built:', order);
            return true;
        } catch (error) {
            console.error('Error building order:', error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { marketToken: "123", amount: 100, side: "BUY" }
            },
            {
                user: "{{user2}}",
                content: { text: "Order built successfully" }
            }
        ]
    ] as ActionExample[][]
};