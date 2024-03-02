// Env
import Env from '../Env';

// Interface
import User from "../interfaces/User.interface";
import { UniswapERC20Token, UniswapERC20Tokens } from '../interfaces/Uniswap.Interface';

const ERC20Service = {

    /**
     * Fetch ERC20 Tokens Supported by Uniswap
     * @returns JSON of ERC20 Tokens for dropdown
     */
    async getUniswapTokens(user: User) {
        const path = `https://tokens.coingecko.com/uniswap/all.json`;
        return new Promise<UniswapERC20Token[]>( async (resolve, reject) => {
            try {
                const res = await Env.externalRequest(path).get(path)
                const allTokens = res.data as UniswapERC20Tokens;
                const keywords = [
                    "USDT", "USDC", "BUSD", "DAI", "WBTC", "UNI", "LINK", "MKR", "AAVE",
                    "COMP", "YFI", "SUSHI", "SNX", "ZRX", "BAT", "UMA", "MANA", "ENJ", "REN"
                ];
                const tokens = allTokens?.tokens.filter((token) => keywords.includes(token.symbol));
                // Sort by keyword order above
                tokens.sort((a, b) => {
                    return keywords.indexOf(a.symbol) - keywords.indexOf(b.symbol);
                });
                resolve(tokens);                
            } catch (error) {
                reject(error);
            }
        });
    }

}

export default ERC20Service;