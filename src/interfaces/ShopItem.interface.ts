export interface ShopItemPayload {
    wallet: string;
    itemID: number;
    transactionHash: string;
    testnet: boolean;
}

export interface ShopItem {
    id: number;
    type: 'collection' | 'cardframe';
    name: string;
    description: string;
    collection: string;
    cost_usdc: number;
    cost_eth: number;
}