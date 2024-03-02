// React
import { UserContext, sepolia } from '../Context';
import { useContext, useEffect, useState } from 'react';

// Ionic
import { IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonPage, IonTitle, IonToolbar, useIonAlert, useIonViewDidEnter } from '@ionic/react';

// Interfaces
import { UserState } from '../interfaces/User.interface';
import { ShopItem, ShopItemPayload } from '../interfaces/ShopItem.interface';
import { ERC20tokenABI, UniswapERC20Token } from '../interfaces/Uniswap.Interface';

// Styles
import './Shop.scss';

// Components
import ZeroxModal, { TestTokenObject } from '../components/0x/0xModal';
import CardFrame from '../components/shop/CardFrame';
import WaitModal from '../components/ui/WaitModal';

// Services
import ColosseumService from '../services/ColosseumService';
import SupabaseService from '../services/SupabaseService';
import ERC20Service from '../services/ERC20Service';

// Utils
import { tilt } from '../Utils';

import GladiatorReceiver from '../web3/contracts/gladiator-receiver.json';
import { useHistory } from 'react-router';

// Images
import ethIcon from '../images/0x/eth.png';
import link from '../images/0x/link.png';
import usdc from '../images/0x/usdc.png';
import swapIcon from '../images/0x/swap.svg'

// Purchase Support
import mentalHealthIcon from '../images/shop/mental-health.svg';
import animalSanctuaryIcon from '../images/shop/animal-sanctuary.svg';
import cancerSupportIcon from '../images/shop/cancer-support.svg';
import gamePlayIcon from '../images/shop/game.svg';

// Contracts
export const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const GladiatorReceiverSepolia = '0x6ffBe5FbAcd16CF99DEec29Fb44057770Fbd9302';
export const GladiatorReceiverMainnet = '0x3AB6d76E56FD27A32A2dEc87820681AA40395f4C';


const Shop: React.FC = () => {

    // History
    const history = useHistory();

    const { user, setZeroXModal, shopItems, getShopItems, testnet, zeroXModal, waitModal, setWaitModal } = useContext<UserState>(UserContext);

    const [presentAlert] = useIonAlert();
    const [buyItemModal, setBuyItemModal] = useState<boolean>(false);
    const [allShopitems, setAllShopitems] = useState<ShopItem[]>([]);
    const [shopItem, setShopItem] = useState<ShopItem | null>(null);
    const [ethBalance, setEthBalance] = useState<number>(0);
    const [erc20Balance, setErc20Balance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    useIonViewDidEnter(() => {
        SupabaseService.getShopItems().then((res) => {
            setAllShopitems(res)
            setTimeout(() => {
                setLoading(false);
                tilt('tilt-js-shop');
            }, 250)
        }).catch((err) => {
            console.log(err);
        });
    });

    useEffect(() => {
        if (user.wallet)  {
            balanceCheck();
        }
    }, [user.wallet, shopItems, zeroXModal]);

    const balanceCheck = async () => {

        // Get ERC20 Balance
        const preferredERC20 = testnet ? 'LINK' : 'USDC';

        let erc20Token: UniswapERC20Token = {} as UniswapERC20Token;
        
        if (testnet) {
            erc20Token = await TestTokenObject.tokens.find(token => token.symbol ===preferredERC20)!;
        } else {
            await ERC20Service.getUniswapTokens(user).then( async (tokens: any) => {
                erc20Token = tokens.find((token: UniswapERC20Token) => token.symbol === preferredERC20)!;
            });
        }

        const tokenContract = new user.web3.eth.Contract(ERC20tokenABI, erc20Token?.address);

        // Get the balance
        const erc20balance = await tokenContract.methods.balanceOf(user.wallet).call();
        const formattedBalance = erc20balance / Math.pow(10, erc20Token?.decimals!);
        setErc20Balance(formattedBalance);


        // Get the balance
        const ethBalance = await user.web3.eth.getBalance(user.wallet);
        const formattedEthBalance = user.web3.utils.fromWei(ethBalance);
        setEthBalance(parseFloat(formattedEthBalance));

    }

    /**
     * Handle Swap Error
     * @param error Error message
     */
    const handlePurchaseError = (error: any) => {
        setWaitModal(false);
        presentAlert({
            header: 'Transaction Error',
            message: `${error.message}`,
            buttons: ['OK'],
        })
    }

    /**
     * Handle Purchase Success
     */
    const handlePurchaseSuccess = () => {
        setWaitModal(false);
        presentAlert({
            header: 'Congratulations!!!',
            message: `Your upgrade is now available for gameplay!`,
            buttons: ['OK'],
            onDidDismiss: () => {
                setBuyItemModal(false);
                balanceCheck();
            }
        })
    }

    /**
     * Preview Buy Shop Item
     * @param item Shop Item
     */
    const previewBuyShopItem = (item: ShopItem) => {
        setShopItem(item);
        setBuyItemModal(true);
    }

    /**
     * Wait for Transaction Receipt
     * @param transactionHash Transaction Hash
     */
    async function waitForTransactionReceipt(transactionHash: string): Promise<void> {
        console.log(`Waiting for transaction to be mined...`);

        const interval = 3000; // Polling interval in milliseconds
        const timeout = 60000; // Timeout in milliseconds, e.g., 60 seconds

        const receipt = await new Promise((resolve, reject) => {
            const startTime = Date.now(); // Capture start time for timeout
            const intervalId = setInterval(async () => {
                try {
                    const receipt = await user.web3.eth.getTransactionReceipt(transactionHash);
                    if (receipt) {
                        clearInterval(intervalId);
                        resolve(receipt);
                        return;
                    } else {
                        console.log(`Transaction receipt not found yet, continuing to wait...`);
                    }
                } catch (error) {
                    console.log('Transaction receipt not found yet, continuing to wait...');
                }

                // Check for timeout
                if (Date.now() - startTime > timeout) {
                    clearInterval(intervalId);
                    handlePurchaseError('Timeout waiting for transaction receipt');
                }
            }, interval);
        });

        console.log('Transaction confirmed with receipt:', receipt);
    }

    /**
     * Buy Shop Item
     * @param item 
     * @param token 
     */
    const buyShopItem = async (item: ShopItem, token: 'ETH' | 'LINK' | 'USDC') => {

        if (!user.wallet || !shopItem) {
            return;
        }

        // Prepare contract
        const contract = new user.web3.eth.Contract(GladiatorReceiver, testnet ? GladiatorReceiverSepolia : GladiatorReceiverMainnet);

        // Switch Cost based on what is defined in the database
        let cost: string;
        switch (token) {
            case 'ETH':
                cost = `${item.cost_eth}`
                break;
            case 'LINK':
                cost = `${item.cost_usdc}`
                break;
            case 'USDC':
                cost = `${item.cost_usdc}`
                break;

        }

        // Amount in Wei
        const amountInWei = user.web3.utils.toWei(`${cost}`, 'ether');

        /**
         * Purchase with ETH
         */
        if (token === 'ETH') {

            // Construct the transaction object
            const transactionParameters = {
                from: user.wallet,
                to: testnet ? GladiatorReceiverSepolia : GladiatorReceiverMainnet,
                value: amountInWei,
                gas: ''
            };

            // Estimate gas for the transaction
            const estimatedGas = await user.web3.eth.estimateGas(transactionParameters);

            // Add a buffer to the estimated gas (optional, for example, 10% more)
            const gasWithBuffer = Math.floor(estimatedGas * 1.1);

            // Include the estimated gas with buffer in the transaction parameters
            transactionParameters.gas = gasWithBuffer.toString();

            try {

                setWaitModal(true)

                // Send the transaction
                const transactionHash: string = await new Promise((resolve, reject) => {
                    user.web3.eth.sendTransaction(transactionParameters)
                        .on('transactionHash', resolve)
                        .on('error', reject);
                });

                // Prepare payload for server
                const payload: ShopItemPayload = {
                    wallet: user.wallet!,
                    itemID: shopItem?.id,
                    transactionHash,
                    testnet
                }

                // Wait for transaction receipt
                waitForTransactionReceipt(transactionHash).then(async (receipt) => {
                    handlePurchaseSuccess();
                    setTimeout(() => {
                        getShopItems();
                    }, 2000)
                }).catch((error) => {
                    handlePurchaseError(error);
                });

                // Sent the transaction payload to the server
                ColosseumService.purchaseShopItem(payload).catch((error) => {
                    console.error(error);
                });

            } catch (error) {
                handlePurchaseError(error);
            }

        /**
         * Purchase with USDC / LINK
         */
        } else {

            setWaitModal(true)

            // Get the token contract
            const token = TestTokenObject.tokens.find(token => testnet ? token.symbol === 'LINK' : token.symbol === 'USDC')?.address;
            const tokenContract = new user.web3.eth.Contract(ERC20tokenABI, token);

            // Get the current allowance
            const currentAllowance = await tokenContract.methods.allowance(user.wallet, testnet ? GladiatorReceiverSepolia : GladiatorReceiverMainnet).call();

            // If the current allowance is less than the amount to send, then we need to approve the transaction
            if (currentAllowance < amountInWei) {
                try {
                    await tokenContract.methods.approve(testnet ? GladiatorReceiverSepolia : GladiatorReceiverMainnet, amountInWei).send({ from: user.wallet! });
                } catch (error) {
                    handlePurchaseError(error);
                    return;
                }
            }

            // Prepare the deposit transaction
            const depositTx = contract.methods.deposit(token, amountInWei);

            // MetaMask will prompt the user to approve the transaction
            await depositTx.send({ from: user.wallet })
                    .on('transactionHash', (transactionHash: string) => {

                        const payload: ShopItemPayload = {
                            wallet: user.wallet!,
                            itemID: shopItem?.id,
                            transactionHash,
                            testnet
                        }
        
                        waitForTransactionReceipt(transactionHash).then(async (receipt) => {
                            handlePurchaseSuccess();
                            setTimeout(() => {
                                getShopItems();
                            }, 2000)
                        }).catch((error) => {
                            handlePurchaseError(error);
                        });
        
                        ColosseumService.purchaseShopItem(payload).catch((error) => {
                            console.error(error);
                        });

                    })
                    .on('error', (error: any) => {
                        handlePurchaseError(error);
                    });

        }

    }

    return (
        <IonPage className='ion-page-shop z-2'>
            <IonContent fullscreen>

                <div className="gladiator-shop-container">
                    <div className="colosseum-backdrop" />
                    <div className="backdrop-overlay" />
                    <div className={`w-100`}>
                        <div className="relative row">
                            <div className="column small-4 flex justify-center">
                                {testnet ? (
                                    <div className="usdc-balance flex items-center">
                                        <img src={link} alt="" className="token-logo mr2" />
                                        <span className="label">{erc20Balance.toFixed(4)} LINK</span>
                                    </div>
                                ) : (
                                    <div className="usdc-balance flex items-center">
                                        <img src={usdc} alt="" className="token-logo mr2" />
                                        <span className="label">{erc20Balance.toFixed(4)} USDC</span>
                                    </div>
                                )}
                                <div className="eth-balance flex items-center ml3">
                                    <img src={ethIcon} alt="" className="token-logo mr2" />
                                    <span className="label">{ethBalance.toFixed(4)} ETH</span>
                                </div>
                            </div>
                            <div className="column small-4 tc">
                                <h2 className='gladiator-arena ml3'>Shop</h2>
                            </div>
                            <div className="column small-4 flex items-center">
                                <div className='w-100 tc'>
                                    <IonButton color={'primary'} onClick={() => setZeroXModal(true)}>
                                        <IonIcon icon={swapIcon} className='mr2' />
                                        Swap Tokens
                                    </IonButton>
                                </div>
                            </div>
                        </div>
                        <div className="relative row shop-content">
                            <div className="gladiator-top-border" />
                            <div className="gladiator-bottom-border" />
                            <div className="column small-12 relative z-4 flex flex-wrap justify-center pb6 h-100">
                                <div className="row w-100 flex justify-center items-center player-cards">
                                    {allShopitems.filter(item => item.type === 'cardframe').map((item) => {
                                        return (
                                            <div className="column small-12 medium-6 large-3" key={`shop_item_${item.id}`}>
                                                {item.type === 'cardframe' && (
                                                    <CardFrame shopItem={item} />
                                                )}
                                                <div className="actions tc">
                                                    <IonButton
                                                        disabled={
                                                            shopItems?.find(ownedItem => ownedItem.id === item.id) ? true : false
                                                        }
                                                        className="gladiator-arena gladiator-arena-border"
                                                        onClick={() => {
                                                            previewBuyShopItem(item);
                                                        }}
                                                    >
                                                        <span className="pt2 gladiator-arena">Buy </span>
                                                    </IonButton>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="tilt-js-shop" />

                <ZeroxModal />

                <IonModal
                    className="shop-item-modal"
                    isOpen={buyItemModal}
                    onDidDismiss={() => setBuyItemModal(false)}
                    showBackdrop={true}
                    onDidPresent={() => {
                        tilt('tilt-js-shop');
                    }}
                >
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle><span className="dib pt2 mt1 gladiator-arena">Purchase Accessory</span></IonTitle>
                            <IonButton slot='end' onClick={() => setBuyItemModal(false)}>
                                <span className="pt2 gladiator-arena white">Close</span>
                            </IonButton>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <div className="modal-content tc">
                            <div className="row relative">
                                <div className="column small-12 medium-6">
                                    <div className="sticky-stop-item">
                                    {shopItem?.type === 'cardframe' && (
                                        <CardFrame shopItem={shopItem} />
                                    )}

                                    </div>
                                </div>
                                <div className="column small-12 medium-6">

                                    <div className="modal-header mt5">
                                        <h2 className='gladiator-arena'>
                                            {shopItem?.name} 
                                        </h2>
                                    </div>
                                    <div className="modal-body ph4 row">
                                        <div className="column small-12 lh-copy bb b--white-20 animate__animated animate__fadeIn">
                                            <p>Description: {shopItem?.description}</p>
                                            <p>Upgrade Type: {shopItem?.type}</p>
                                        </div>
                                    </div>
                                    <div className="charity row">
                                        <div className="column small-12">
                                            <p className='lh-copy pb4 mb4 bb b--white-20 animate__animated animate__fadeIn'>All Gladiator game purchases support public good. When you buy accessories to enhance gameplay, you are supporting the following causes all around the world:</p>
                                        </div>
                                        <div className="column small-6 large-6 animate__animated animate__zoomIn">
                                            <IonIcon src={mentalHealthIcon} />
                                            <p className='b'>Children's Mental Health</p>
                                            <p>Your purchase brightens a child's world, fostering mental wellness and joy.</p>
                                        </div>
                                        <div className="column small-6 large-6 animate__animated animate__zoomIn">
                                            <IonIcon src={animalSanctuaryIcon} />
                                            <p className='b'>Animal Sanctuaries</p>
                                            <p>Each accessory you buy offers refuge to animals, nurturing safe sanctuaries.</p>
                                        </div>
                                        <div className="column small-6 large-6 animate__animated animate__zoomIn">
                                            <IonIcon src={cancerSupportIcon} />
                                            <p className='b'>Cancer Support</p>
                                            <p>Buying game add-ons aids cancer support, spreading hope and comfort.</p>
                                        </div>
                                        <div className="column small-6 large-6 animate__animated animate__zoomIn">
                                            <IonIcon src={gamePlayIcon} />
                                            <p className='b'>Gladiator Development</p>
                                            <p>Your purchase propels Gladiator development, crafting new adventures.</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="mb4"></div>
                        </div>
                    </IonContent>
                    <IonFooter class="tc">
                        <IonToolbar class="tc">
                            <div className="row flex justify-around items-center">
                                <IonButton
                                    className='mh2'
                                    slot='end'
                                    color={'primary'}
                                    onClick={() => {
                                        buyShopItem(shopItem!, 'ETH')
                                    }}
                                >
                                    Buy for <img src={ethIcon} alt="" className="token-logo mh2" /> {shopItem?.cost_eth} ETH
                                </IonButton>
                                <IonButton
                                    className='mh2'
                                    slot='end'
                                    color={'primary'}
                                    onClick={() => {
                                        buyShopItem(shopItem!, 'USDC')
                                    }}
                                >
                                    Buy for <img src={testnet ? link : usdc} alt="" className="token-logo mh2" /> {shopItem?.cost_usdc} {testnet ? `LINK` : `USDC`}
                                </IonButton>
                            </div>
                        </IonToolbar>
                    </IonFooter>
                </IonModal>

                <WaitModal />

            </IonContent>
        </IonPage>
    );
};

export default Shop;
