export interface PriceResponse {
    price: string;
    grossPrice: string;
    guaranteedPrice: string;
    estimatedPriceImpact: string;
    to: string;
    data: string;
    value: string;
    gasPrice: string;
    gas: string;
    estimatedGas: string;
    protocolFee: string;
    minimumProtocolFee: string;
    buyAmount: string;
    grossBuyAmount: string;
    sellAmount: string;
    grossSellAmount: string;
    sources: PriceQuoteSource[];
    buyTokenAddress: string;
    sellTokenAddress: string;
    allowanceTarget: string;
    orders: Order[];
    type: string;
    sellTokenToEthRate: string;
    buyTokenToEthRate: string;
}

export interface PriceQuoteSource {
    name: string;
    proportion: string;
}

export interface QuoteResponse {
    sellAmount: string;
    buyAmount: string;
    price: string;
    guaranteedPrice: string;
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
    buyTokenAddress: string;
    sellTokenAddress: string;
    allowanceTarget: string;
}

export interface Order {
    makerToken: string;
    takerToken: string;
    makerAmount: string;
    takerAmount: string;
    fillData: {
        tokenAddressPath: string[];
        router: string;
    };
    source: string;
    sourcePathId: string;
    type: number;
    allowanceTarget: string;
    sellTokenToEthRate: string;
    buyTokenToEthRate: string;
    fees: {
        zeroExFee: string | number | null;
    };
    grossPrice: string;
    grossBuyAmount: string;
    grossSellAmount: string;
}