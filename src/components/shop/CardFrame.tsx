import { UserContext } from '../../Context';
import React, { useState, useEffect, useContext } from 'react';

// Interfaces
import { UserState } from '../../interfaces/User.interface';
import { ShopItem } from '../../interfaces/ShopItem.interface';

// Muffins
//// Cards
import muffinUpgradeFront from '../../../src/collections/cosmicmuffins/card/cardfront-gold.png';
import muffinUpgradeBack from '../../../src/collections/cosmicmuffins/card/cardback-gold.png';

// Moths
//// Cards
import mothUpgradeFront from '../../../src/collections/sacredmoths/card/card-front-diamond.png';
import mothUpgradeBack from '../../../src/collections/sacredmoths/card/card-back-diamond.png';

// Images
import darkMuffin from '../../images/shop/dark-muffin.png';
import darkMoth from '../../images/shop/dark-moth.png';

/**
 * Hey Danno, clean this up when you have some time
 */
const muffinContract = `0x500f40b999d387cd81ed8c464cef8260abe5fc03`;
const mothContract = `0x4Ed2ff3960d76622A8B9C8693AB64Fd4B312D4b7`;

interface Props {
    shopItem: ShopItem;
}

const CardFrame: React.FC<Props> = ({ shopItem }) => {

    const { shopItems } = useContext<UserState>(UserContext);

    const [owned, setOwned] = useState<boolean>(false);
    const [cardFlipped, setCardFlipped] = useState<boolean>(true);  

    const [muffinFrameUpgrade, setMuffinFrameUpgrade] = useState<boolean>(false);
    const [mothFrameUpgrade, setMothFrameUpgrade] = useState<boolean>(false);

    useEffect(() => {
        if (shopItems) {
            const ownedItem = shopItems.find(item => item.id === shopItem.id);
            if (ownedItem) {
                setOwned(true);
            }
        }
    }, [shopItems]);

    return (
        <>

        <div 
          id={`card_${shopItem.id}`}
          className={`
            player-card 
            shop-item
            gladiator-arena
            flip-card
            owned-${owned}
            ${cardFlipped ? `flipped` : `not-flipped`} 
            pointer
          `} 
          onClick={() => { 
            setCardFlipped(!cardFlipped)
          }}
        >
            <div className={`aspect-ratio aspect-ratio--5x7`}>
                <div className="aspect-ratio--object">
                    <div className="flip-card-inner">
                        <div className="flip-card-front">
                            <div className='front-card-container'>
                            <div className='card-contents animate__animated animate__zoomIn'>
                                <div className="nft" data-tilt data-tilt-glare data-tilt-max-glare="0.4" data-tilt-max="6">
                                    <div className="art-container-bg" />  
                                    <div 
                                        className="art-container"
                                        style={{ backgroundImage: `url(${ shopItem.collection === muffinContract ? darkMuffin : darkMoth })` }}
                                    />  
                                    <div className="card-text-behind-frame">
                                    </div>
    
                                    <div className="card-frame">
                                        {shopItem.collection === muffinContract ? (
                                        <img src={muffinUpgradeFront} alt={shopItem.collection} />
                                        ) : null}
                                        {shopItem.collection === mothContract ? (
                                        <img src={mothUpgradeFront} alt="" />
                                        ) : null}
                                        {/* {shopItem.collection !== 'cosmicmuffins' && shopItem.collection !== 'sacredmoths' ? (
                                        <img src={muffinUpgradeFront} alt="" />
                                        ) : null} */}
                                    </div>
    
                                    <div className="card-text">
                                        <div className="name gladiator-arena">{shopItem.name}</div>
                                        <div className="owned-overlay gladiator-arena">
                                            {owned ? (
                                            <>
                                                Purchased
                                            </>
                                            ) : (
                                            <>
                                            </>
                                            )}
                                        </div>                                  
                                    </div>
                                </div>
                            </div>                      
                            </div>
                        </div>
                        <div className="flip-card-back">
                            <div className="back-card-container pointer"> 
                                <div className='card-contents animate__animated animate__zoomIn'>
                                <div className="nft" data-tilt data-tilt-glare data-tilt-max-glare="0.4" data-tilt-max="6">
                                    <div className="card-frame">
                                        {shopItem.collection === muffinContract ? (
                                        <img src={muffinUpgradeBack} alt="" />
                                        ) : null}
                                        {shopItem.collection === mothContract ? (
                                        <img src={mothUpgradeBack} alt="" />
                                        ) : null}
                                        {/* {shopItem.collection !== 'cosmicmuffins' && shopItem.collection !== 'sacredmoths' ? (
                                        <img src={muffinUpgradeBack} alt="" />
                                        ) : null} */}
                                    </div>
                                </div>
                                </div>
                            </div>
                        </div>                  
                    </div>
                </div>
            </div>
        </div>  
    
    {/* <div className={`shopItem animate__animated animate__zoomIn`}>
                <p>{shopItem.name}</p>
                <p>{shopItem.description}</p>
                <p>Type: {shopItem.type}</p>
                <p>ERC20: {shopItem.cost_usdc}</p>
                <p>ETH: {shopItem.cost_eth}</p>
            </div> */}
        
        </>

    );

}

export default CardFrame;
