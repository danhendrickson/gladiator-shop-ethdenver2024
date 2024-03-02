// Web3
import { Web3Provider, walletProviders } from "../web3/web3";

// Types
import { GameModeTypesInterface } from "../types/GameModes.type";
import H5AudioPlayer from "react-h5-audio-player";

// Colyseus
import * as Colyseus from "colyseus.js";
import { TokenMetadata } from "../generated/TokenMetadata";
import { ShopItem } from "./ShopItem.interface";

export interface UserState {

    // States
    user: User;
    tokensLoaded: boolean;
    mode: GameModeTypesInterface | null;
    settings: boolean;
    setSettings: (boolean: boolean) => void;
    audioPlaying: boolean;
    setAudioPlaying: (boolean: boolean) => void;
    musicPlayer: H5AudioPlayer | null;
    setMusicPlayer: (player: H5AudioPlayer) => void;

    // Context Methods
    openConnectWalletModal: (boolean: boolean) => void;
    chooseProvider: (provider: walletProviders) => void;
    getTokensOwned: (user: User) => any;
    setGameMode: (mode: GameModeTypesInterface) => any;
    setSocket: (socket: Colyseus.Client) => any;
    startLoading: () => any;
    logout: () => void;

    demo: boolean;
    playDemo: () => void;

    // 0x
    zeroXModal: boolean;
    setZeroXModal: (boolean: boolean) => void;

    // Shop Items:
    shopItems: ShopItem[]
    setShopItems: (items: ShopItem[]) => void;
    getShopItems: () => void;

    // Purchase Modal
    waitModal: boolean;
    setWaitModal: (boolean: boolean) => void;

    // Testnet
    testnet: boolean;
}

export default interface User {

    // User
    wallet: string | null;
    provider?: Web3Provider;
    web3?: any;
    ethBalance?: number;

    // Play Mode
    mode?: GameModeTypesInterface;

    // Tokens
    muffins: TokenMetadata[];
    moths: TokenMetadata[];
    bedlams: TokenMetadata[];
    mechapenguins: TokenMetadata[];
    spaceguins: TokenMetadata[];
    mechaapes: TokenMetadata[];
    philosophers: TokenMetadata[];
    souloracles: TokenMetadata[];

    // Connection
    socket: Colyseus.Client | null

}