import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { ethers } from 'ethers';
import NodeCache from "node-cache";
import { PROVIDER_CONFIG } from '../types/events';

export class WalletProvider {
    private readonly provider: ethers.JsonRpcProvider;
    private readonly usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    private readonly usdcAbi = ['function balanceOf(address) view returns (uint256)'];
    private cache: NodeCache;

    constructor() {
        this.provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
        this.cache = new NodeCache({ stdTTL: 300 });
    }

    private getWallet(): ethers.Wallet {
        const walletPrivateKey = process.env.POLYGON_WALLET_PRIVATE_KEY;
        if (!walletPrivateKey) {
            throw new Error('Private key not found in environment variables');
        }
        return new ethers.Wallet(walletPrivateKey, this.provider);
    }

    getAddressForPrivateKey(): string {
        return this.getWallet().address;
    }

    async fetchUsdcBalance(): Promise<number> {
        try {
            const cacheKey = `usdc-balance-${this.getAddressForPrivateKey()}`;
            const cachedValue = this.cache.get<number>(cacheKey);
            if (cachedValue !== undefined) return cachedValue;

            const wallet = this.getWallet();
            const usdcContract = new ethers.Contract(this.usdcAddress, this.usdcAbi, this.provider);

            const balance = await usdcContract.balanceOf(wallet.address);
            const formattedBalance = Number(ethers.formatUnits(balance, 6));

            this.cache.set(cacheKey, formattedBalance);
            return formattedBalance;
        } catch (error) {
            console.error('Error getting USDC balance:', error);
            return 0;
        }
    }

    async getFormattedBalance(runtime: IAgentRuntime): Promise<string> {
        try {
            const balance = await this.fetchUsdcBalance();
            return `USDC Balance: $${balance.toFixed(2)}`;
        } catch (error) {
            console.error("Error generating balance report:", error);
            return "Unable to fetch USDC balance. Please try again later.";
        }
    }
}

export const walletProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> => {
        try {
            const provider = new WalletProvider();
            return provider.getFormattedBalance(runtime);
        } catch (error) {
            console.error("Error in wallet provider:", error);
            return null;
        }
    },
};
