// Utils
import { dc } from '../Utils';
import { BigNumber } from "@0x/utils";

// Interfaces
import User from "../interfaces/User.interface";
import { ERC20tokenABI, UniswapERC20Token } from "../interfaces/Uniswap.Interface";
import { Order, PriceResponse, QuoteResponse } from '../interfaces/0x.interface';

const OxService = {

    /**
     * Check the price for a given token swap
     * @param user User object
     * @param sell Sell token
     * @param buy Buy token
     * @param amount Amount
     * @param testnet Testnet
     * @returns Promise<PriceResponse>
     */
    async price(
        user: User,
        sell: UniswapERC20Token | any,
        buy: UniswapERC20Token | any,
        amount: number,
        testnet: boolean
    ) {
        return new Promise<PriceResponse>(async (resolve, reject) => {

            // Calculate the amount based on the token's decimals
            let calcAmount = amount * 10 ** sell.decimals
            
            // Prepare URL query params
            const params = {
                sellToken: sell.address,
                buyToken: buy.address,
                sellAmount: calcAmount.toString(),
            }

            // Prepare query
            const basePath = testnet ? 'https://sepolia.api.0x.org/' : 'https://api.0x.org/'
            const queryParams = new URLSearchParams(params).toString()
            const path = `swap/v1/price?${queryParams}`

            try {
                const response = await fetch(`${basePath}${path}`, {
                    headers: {
                        '0x-api-key': `${dc(process.env.REACT_APP_0X_API_KEY)}`,
                    },
                })
                if (!response.ok) {
                    reject(response.statusText)
                    return;
                }
                const data = await response.json()
                resolve(data as PriceResponse)
            } catch (error) {
                reject(error)
            }
        })
    },

    /**
     * Create a new order ()
     * @param user User object
     * @param sell Sell token
     * @param buy Buy token
     * @param amount Amount
     * @param price Price
     * @param testnet Testnet
     * @returns 
     */
    async quote(
        user: User,
        sell: UniswapERC20Token | any,
        buy: UniswapERC20Token | any,
        amount: number,
        price: PriceResponse,
        testnet: boolean
    ) {
        return new Promise<QuoteResponse>(async (resolve, reject) => {

            // Make sure the user is connected
            if (!user.wallet) {
                reject('User not connected')
                return;
            }

            // Calculate the amount based on the token's decimals
            let calcAmount = amount * 10 ** sell.decimals

            // Prepare URL query params
            const params = {
                sellToken: sell.address,
                buyToken: buy.address,
                sellAmount: calcAmount.toString(),
                takerAddress: user.wallet,
            }

            // Prepare query
            const basePath = testnet ? 'https://sepolia.api.0x.org/' : 'https://api.0x.org/'
            const queryParams = new URLSearchParams(params).toString()
            const path = `swap/v1/quote?${queryParams}`

            try {

                // Check allowance
                const tokenContract = new user.web3.eth.Contract(ERC20tokenABI, sell?.address);
                const currentAllowance = await tokenContract.methods.allowance(user.wallet, price.allowanceTarget).call();

                // Set Approval
                if (currentAllowance < params.sellAmount) {
                    try {
                        await tokenContract.methods.approve(price.allowanceTarget, params.sellAmount).send({ from: params.takerAddress })                        
                    } catch (error) {
                        reject(error);
                        return;
                    }
                }

                const response = await fetch(`${basePath}${path}`, {
                    headers: {
                        '0x-api-key': `${dc(process.env.REACT_APP_0X_API_KEY)}`,
                    },
                })
                if (!response.ok) {
                    reject(response.statusText)
                    return;
                }
                const data = await response.json()
                resolve(data as QuoteResponse)
            } catch (error) {
                reject(error)
            }
        })
    }

}

export default OxService;