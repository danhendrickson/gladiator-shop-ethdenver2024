interface TokenResult {
    TokenAddress: string;
    TokenId: string;
}

export interface EtherscanResponse {
    status: string;
    message: string;
    result: TokenResult[];
}