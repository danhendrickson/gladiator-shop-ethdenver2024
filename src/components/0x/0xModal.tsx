// React
import { useContext, useEffect, useState } from "react";
import { UserContext, sepolia } from "../../Context";

// Ionic
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonImg, IonInput, IonModal, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonTitle, IonToolbar, useIonAlert } from "@ionic/react";
import { chevronDown } from "ionicons/icons";

// Services
import ERC20Service from "../../services/ERC20Service";
import OxService from "../../services/0xService";

// Interfaces
import { UserState } from "../../interfaces/User.interface";
import { ERC20tokenABI, UniswapERC20Token } from "../../interfaces/Uniswap.Interface";
import { PriceResponse } from "../../interfaces/0x.interface";

// Styles
import './0xModal.scss';

// Images
import zeroXlogo from '../../images/0x/0x.png'
import ethIcon from '../../images/0x/eth.png'
import link from '../../images/0x/link.png'
import swapIcon from '../images/0x/swap.svg'

// Object for ETH related operations
export const ETH = {
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    chainId: 1,
    logoURI: ethIcon,
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18
}

// Test net object (yeah yeah I know this can be cleaner)
export const TestTokenObject = {
    "name": "Test Tokens",
    "logoURI": "",
    "keywords": [
        "defi"
    ],
    "timestamp": "",
    "tokens": [
        {
            "chainId": sepolia,
            "address": '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            "name": 'Ether',
            "symbol": 'ETH',
            "decimals": 18,
            "logoURI": ethIcon
        },
        {
            "chainId": sepolia,
            "address": "0x779877A7B0D9E8603169DdbD7836e478b4624789",
            "name": "Link",
            "symbol": "LINK",
            "decimals": 18,
            "logoURI": link
        },
        {
            "chainId": 1,
            "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            "name": "USDC",
            "symbol": "USDC",
            "decimals": 6,
            "logoURI": "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png?1696506694"
        }
    ],
    "version": {
        "major": 217,
        "minor": 1,
        "patch": 0
    }
}

const OxModal: React.FC = () => {

    const { user, zeroXModal, setZeroXModal, testnet, waitModal, setWaitModal } = useContext<UserState>(UserContext);

    const [presentAlert] = useIonAlert();
    const [loading, setLoading] = useState<boolean>(true);
    const [tokens, setTokens] = useState<UniswapERC20Token[]>([]);
    const [results, setResults] = useState<UniswapERC20Token[]>([]);

    // Tokens Selected
    const [from, setFrom] = useState<UniswapERC20Token>();
    const [fromAmount, setFromAmount] = useState<number | undefined>();
    const [fromBalance, setFromBalance] = useState<number | undefined>(0);
    const [to, setTo] = useState<UniswapERC20Token>();
    const [toAmount, setToAmount] = useState<number | undefined>();

    // Sell / Buy Modal
    const [openFrom, setOpenFrom] = useState<boolean>(false);
    const [openTo, setOpenTo] = useState<boolean>(false);
    
    // Price Response
    const [price, setPrice] = useState<PriceResponse>();
    const [priceToAmount, setPriceToAmount] = useState<string>('0.00');
    const [gasEstimate, setGasEstimate] = useState<number>();
    const [feeString, setFeeString] = useState<string>('');

    useEffect(() => {
        getPrice()
    }, [from, to, fromAmount, toAmount])

    /**
     * Handle Swap Error
     * @param error Error message
     */
    const handleSwapError = (error: any) => {
        setWaitModal(false);
        presentAlert({
            header: 'Transaction Message',
            message: `${error.message}`,
            buttons: ['OK'],
        })
    }

    /**
     * Handle Swap Success
     */
    const handleSwapSuccess = () => {
        setWaitModal(false);
        presentAlert({
            header: 'Well done Gladiator!',
            message: `Token Swap Successful!`,
            buttons: ['OK'],
            onDidDismiss: () => {
                resetFromAndToAmounts()
                setZeroXModal(false)
            }
        })
    }

    /**
     * Reset From and To Amounts
     */
    const resetFromAndToAmounts = () => {
        setFromAmount(undefined);
        setToAmount(undefined);
        setPriceToAmount('0.00');
        setGasEstimate(0);
        setFeeString('');
        setTo(undefined);
    }

    /**
     * Get Price of Token Swap
     */
    const getPrice = async () => {
        if (user && from && to && fromAmount) {

            OxService.price(user, from, to, fromAmount, testnet).then(price => {
                if (!price) return;
                
                // Calulate the price based on the token's decimals
                const toCalc = (Number(price.buyAmount) / (10 ** to.decimals));

                // Set the price to the state
                setPriceToAmount(`${toCalc}`);
                setToAmount(parseFloat(toCalc.toString()))
                setPrice(price);

                // Transaction Fee Calculation
                const gasPriceInWei = Number(price.gasPrice); // Assuming this is in wei
                const estimatedGas = Number(price.estimatedGas);
                const transactionFeeInWei = gasPriceInWei * estimatedGas;
                const transactionFeeInETH = transactionFeeInWei / 1e18;

                /**
                 * TODO: 
                 * Consider other tokens and their relative rates for transactions.
                 * How can I improve here?
                 */
                // Convert Transaction Fee to USDC
                // You might need to adjust how you get the ETH to USDC rate
                const ethToUsdcRate = Number(price.sellTokenToEthRate); // Adjust based on actual data structure
                const transactionFeeInUSDC = transactionFeeInETH * ethToUsdcRate;

                // Format the fee string
                setFeeString(`${transactionFeeInETH.toFixed(5)} ETH ($${transactionFeeInUSDC.toFixed(2)} USDC)`);

            }).catch((error) => {
                handleSwapError(error)
            });
        }
    }

    /**
     * Handle Quote
     */
    const handleQuote = async () => {
        if (user && from && to && fromAmount && price) {

            setWaitModal(true);

            OxService.quote(user, from, to, fromAmount, price, testnet).then( async (quote) => {
                if (!quote) return;
                try {
                    await user.web3.eth.sendTransaction(quote).then(() => {
                        handleSwapSuccess()
                    });
                } catch (error) {
                    handleSwapError(error)
                }
            }).catch((error) => {
                handleSwapError(error)
            });
        }
    }
    
    /*
    * Handle Token Search Input
    * @param event - Search event
    */
    const handleInput = (ev: Event) => {
        let query = '';
        const target = ev.target as HTMLIonSearchbarElement;
        if (target) query = target.value!.toLowerCase();
        const filtered = tokens?.filter((d) => (d.name.toLowerCase().indexOf(query) > -1) || (d.symbol.toLowerCase().indexOf(query) > -1));
        setResults([...filtered]);
    };

    /**
     * Check if the user has tokens to swap before allowing them to proceed
     * @param tokenContract Contract ABI object
     */
    const balanceCheck = async (tokenContract: any) => {

        if (from?.symbol !== 'ETH') {

            // Get the balance
            const balance = await tokenContract.methods.balanceOf(user.wallet).call();

            // Convert the balance to a human-readable format
            const formattedBalance = balance / Math.pow(10, from?.decimals!);

            // Display the balance or set it in your UI state
            setFromBalance(formattedBalance);

        } else {

            // Get the balance
            const balance = await user.web3.eth.getBalance(user.wallet);

            // Convert the balance to a human-readable format
            const formattedBalance = user.web3.utils.fromWei(balance);

            // Display the balance or set it in your UI state
            setFromBalance(parseFloat(formattedBalance));

        }
    }

    useEffect(() => {

        // If we have a token selected, check the balance
        if (from) {
            const tokenContract = new user.web3.eth.Contract(ERC20tokenABI, from?.address);    
            balanceCheck(tokenContract)
        }

    }, [from, fromAmount, toAmount, price]);

    return (
        <>
        <IonModal 
            className="zero-x-modal"
            isOpen={zeroXModal} 
            backdropDismiss={true}
            showBackdrop={true}
            onWillPresent={async () => {

                setLoading(true);

                /**
                 * Set Tokens for Experience
                 * @param tokens 
                 */
                const setTokensForExperience = async (tokens: any, testnet: boolean) => {
                    if (!tokens) return;

                    // If ETH is not in the list, add it
                    if (!tokens.find((d: any) => d.symbol === 'ETH')) {
                        tokens.push(ETH);
                    }

                    setTokens(tokens);
                    setResults(tokens);

                    // Default sell
                    const defaultSell = testnet ? 'LINK' : 'USDC';

                    // Set default sell to USDC
                    setFrom(tokens.find((d: UniswapERC20Token) => d.symbol === defaultSell));
                    
                    const defaultBuy = testnet ? 'ETH' : 'ETH';

                    // Set default buy to ETH
                    // setTo(tokens.find((d: any) => d.symbol === defaultBuy));

                    setTimeout(() => {
                        setLoading(false);
                    }, 250)
                }

                const chain: number = await user.provider?.provider.request({ method: 'net_version' });
                const chainID = parseInt(chain.toString())
                
                if (chainID === sepolia) {
                    setTokensForExperience(TestTokenObject.tokens, true);
                } else {
                    ERC20Service.getUniswapTokens(user).then( async (tokens: any) => {
                        setTokensForExperience(tokens, false);
                    }).catch((error) => {
                        handleSwapError(error)
                    });
                }

            }}
            onDidDismiss={() => {
                resetFromAndToAmounts()
                setZeroXModal(false)
            }}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle><span className="dib pt2 mt1 gladiator-arena">Swap Tokens</span></IonTitle>
                    <IonButton slot='end' className="mr2" onClick={() => setZeroXModal(false)}>
                        <span className="white">Close</span>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="row">
                    {loading ? (
                        <div className="animate__animated animate__fadeIn column small-12 flex justify-center items-center flex-column">
                            <p><span className="gladiator-arena">Loading...</span></p>
                            <IonSpinner name="crescent" />
                        </div>
                    ) : (
                        <div className="w-100 animate__animated animate__fadeIn">
                            <div className="column small-12 flex flex-column">
                                <div className="gladiator-arena ttu">
                                    <p>Sell</p>
                                </div>
                                <div className="from-token-select flex justify-between">
                                    <IonButton
                                        size="large"
                                        onClick={() => {
                                            setOpenFrom(true);
                                        }}
                                    >
                                        {from ? (
                                            <>
                                                <IonImg src={from?.logoURI} alt={`Sell ${from?.name}`} class="mr1 token-logo" />
                                                {from?.symbol}
                                                <IonIcon icon={chevronDown} className="ml3" />
                                            </>
                                        ) : (
                                            <>
                                            Select Token <IonIcon icon={chevronDown} />
                                            </>
                                        )}
                                    </IonButton>
                                    <p className="balance flex flex-column tr">
                                        {fromBalance && (
                                            <>
                                                <span>Balance:</span>
                                                <span className="f3">{fromBalance.toFixed(4)}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="from-token-input">
                                    <IonInput 
                                        className="swap-amount"
                                        type="number" 
                                        placeholder="0.0"
                                        step="0.0"
                                        value={fromAmount}
                                        debounce={1200}
                                        onIonInput={(ev) => {
                                            setFromAmount(parseFloat(`${ev.target.value}`))
                                        }}
                                        onIonChange={(ev) => {
                                            setFromAmount(parseFloat(`${ev.detail.value}`));
                                            getPrice()
                                        }}
                                        onBlur={() => {getPrice()}}
                                    />
                                </div>
                            </div>
                            <div className="column small-12 bt b--white-20 mv2" />
                            <div className="column small-12 flex flex-column">
                                <div className="gladiator-arena ttu">
                                    <p>Buy</p>
                                </div>
                                <div className="to-token-select">
                                    <IonButton
                                        size="large"
                                        onClick={() => {
                                            setOpenTo(true);
                                        }}
                                    >
                                        {to ? (
                                            <>
                                                <IonImg src={to?.logoURI} alt={`Buy ${to?.name}`} class="mr1 dib token-logo" />
                                                {to?.symbol}
                                                <IonIcon icon={chevronDown} className="ml3" />
                                            </>
                                        ) : (
                                            <>
                                            Select Token <IonIcon icon={chevronDown} />
                                            </>
                                        )}
                                    </IonButton>
                                </div>
                                <div className="to-token-input pt3">
                                    <IonInput 
                                        className="swap-amount"
                                        type="number" 
                                        placeholder="0.0"
                                        step="0.0"
                                        value={toAmount?.toFixed(9)}
                                        debounce={1200}
                                        onIonChange={(ev) => {
                                            setToAmount(parseFloat(ev.detail.value!));
                                            getPrice()
                                        }}
                                        onBlur={() => {getPrice()}}
                                    />
                                </div>
                            </div>
                            <div className="column small-12">
                                <p className="gas-estimate w-100 flex justify-between w-100">
                                    <span className="w-100 db">
                                        <span className="b mv0">Gas Estimate:</span>
                                    </span>
                                    <span className="w-100 db tr b">
                                        {price?.estimatedGas ? price.estimatedGas : '0.00'}
                                    </span>                                    
                                </p>
                                <p className="fee w-100 flex justify-between w-100">
                                    <span className="w-100 db">
                                        <span className="b mv0">Estimated Transaction Fee:</span>
                                    </span>
                                    <span className="w-100 db tr b">
                                        {feeString ? feeString : '0.00'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </IonContent>
            <IonFooter class="tc">
                <IonToolbar class="tc">
                    <div className="row map pa0">
                        <div className="columns small-6 tl flex items-center">
                            <p className='mr2 nowrap f6'>Powered by</p>
                            <a href="https://0x.org" target="_blank" rel="noopener noreferrer" className="link white">
                                <img src={zeroXlogo} width={40} alt="" />
                            </a>
                        </div>
                        <div className="columns small-6 tr flex justify-end items-center">
                            <IonButton 
                                slot='end' 
                                color={'primary'} 
                                // disabled={!user.wallet || !sell || !buy || !sellAmount || !buyAmount}
                                onClick={() => {
                                    handleQuote()
                                }}
                            >
                                <span className="pt2 gladiator-arena">Quote</span>
                            </IonButton>
                        </div>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonModal>

        {/* Sell Token */}
        <IonModal
            className="zero-x-modal-coin"
            isOpen={openFrom}
            onDidDismiss={() => setOpenFrom(false)}
            showBackdrop={true}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle><span className="dib pt2 mt1 gladiator-arena ttu">Sell</span></IonTitle>
                    <IonButton slot='end' className="mr2" onClick={() => setOpenFrom(false)}>
                        <span className="white">Close</span>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
            <IonSearchbar debounce={250} onIonInput={(ev) => handleInput(ev)}></IonSearchbar>
                {results?.map((result, i) => (
                    <IonButton 
                        size="large"
                        expand="block"
                        key={`result_${i}`}
                        onClick={() => {
                            if (result.symbol === to?.symbol) {
                                setTo(undefined);
                            }
                            setFrom(result);
                            setOpenFrom(false);
                        }}
                    >
                        <IonImg src={result.logoURI} alt="Logo" class="mr1 token-logo" />
                        {result.symbol}
                    </IonButton>
                ))}
            </IonContent>
        </IonModal>

        {/* Buy Token */}
        <IonModal
            className="zero-x-modal-coin"
            isOpen={openTo}
            onDidDismiss={() => setOpenTo(false)}
            showBackdrop={true}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle><span className="dib pt2 mt1 gladiator-arena">Choose Token to Buy</span></IonTitle>
                    <IonButton slot='end' className="mr2" onClick={() => setOpenTo(false)}>
                        <span className="white">
                            Close
                        </span>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
            <IonSearchbar debounce={250} onIonInput={(ev) => handleInput(ev)}></IonSearchbar>
                {results?.filter(t => t.symbol === 'ETH' || t.symbol === 'USDC').map((result, i) => (
                    <IonButton 
                        size="large"
                        key={`result_${i}`}
                        expand="block"
                        onClick={() => {
                            if (result.symbol === from?.symbol) {
                                setFrom(undefined);
                                setFromBalance(undefined);
                            }
                            setTo(result);
                            setOpenTo(false);
                        }}
                    >
                        <IonImg src={result.logoURI} alt="Logo" className="mr1 token-logo" />
                        {result.symbol}
                    </IonButton>
                ))}
            </IonContent>
        </IonModal>
        </>
    );

}

export default OxModal;