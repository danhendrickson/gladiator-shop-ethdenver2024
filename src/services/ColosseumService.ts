// Interfaces
import User from "../interfaces/User.interface";

// Utils
import { compressData } from "../Utils";

// Colyseus
import { Room, RoomAvailable } from "colyseus.js";
import { TokenMetadata } from '../generated/TokenMetadata';
import { Ability } from "../generated/Ability";

// Interface
import { ShopItem, ShopItemPayload } from '../interfaces/ShopItem.interface';
import Env from "../Env";

// Domain
// const domain = `${process.env.NODE_ENV === 'development' ? `http://localhost:8888` : `https://colosseum.brokenreality.com`}`
const domain = `https://colosseum.brokenreality.com`;

const ColosseumService = {

    /**
     * Get available rooms
     * @param user User object
     * @returns Promise<RoomAvailable[]>
     */
    async getRooms(user: User) {
        return new Promise<RoomAvailable[]>((resolve, reject) => {
            if (user.socket) {
                user.socket.getAvailableRooms('battle').then((rooms: RoomAvailable[]) => {
                    // Only return only rooms with singlePlayer = false
                    const allRooms = rooms.filter(room => room.metadata.singlePlayer === false);
                    resolve(allRooms)
                });    
            }
        });
    },

    /**
     * Create a new room
     * @param user User object
     * @param roomName Room Name
     * @returns Promise<Room>
     */
    async createRoom(user: User, roomName: string, singlePlayer?: boolean) {
        return new Promise<Room>((resolve, reject) => {
            if (user.socket && roomName) {
                user.socket.create(roomName, { 
                    wallet: user.wallet,
                    singlePlayer: singlePlayer || false
                }).then(room => {
                    resolve(room)
                });
            }
        });
    },

    /**
     * Join a room
     * @param user User object
     * @param room Room object
     * @returns Promise<Room>
     */
    async join(user: User, room: RoomAvailable) {
        return new Promise<Room>((resolve, reject) => {
            if (user.socket) {
                user.socket.joinById(room.roomId, {
                    wallet: user.wallet
                }).then(room => {
                    resolve(room)
                });
            }
        });
    },

    /**
     * Set tokens to begin
     * @param user User object
     * @param room Room object
     * @param tokens Tokens Selected
     */
    async ready(user: User, room: Room, tokens: TokenMetadata[]) {
        try {
            const message = {
                action: 'ready',
                tokens: tokens.map(token => {
                    return {
                        id: token.token_id,
                        collection: token.collection,
                    }
                }),
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('ready', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * End turn
     * @param user User object
     * @param room Room object
     */
    async endTurn(room: Room) {
        try {
            room.send('endTurn');
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Hover token
     * @param user User object
     * @param room Room object
     * @param token Token Hovered
     */
    async hover(user: User, room: Room, token: TokenMetadata | null) {
        try {
            const message = {
                token,
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('hover', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Click ability
     * @param user User object
     * @param room Room object
     * @param token Token Hovered
     * @param ability Ability
     */
    async click(user: User, room: Room, ability: Ability, token: TokenMetadata) {
        try {
            const message = {
                ability,
                token,
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('click', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Leave room
     * @param user User object 
     * @param room Room object
     * @returns Promise<boolean>
     */
    async leave(user: User, room: Room) {
        return new Promise<boolean>(resolve => {
            if (user.socket) {
                room.leave();
                resolve(true)
            }
        });
    },

    /**
     * Rematch request
     * @param user User object
     * @param room Room object
     */
    async rematch(user: User, room: Room) {
        try {
            const message = {
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('rematchRequest', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Rematch accepted
     * @param user User object
     * @param room Room object
     */
    async rematchAccepted(user: User, room: Room) {
        try {
            const message = {
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('rematchAccepted', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Rematch declined
     * @param user User object
     * @param room Room object
     */
    async rematchDeclined(user: User, room: Room) {
        try {
            const message = {
                wallet: user.wallet
            };
            const data = compressData(JSON.stringify(message))
            room.send('rematchDeclined', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Card ability
     * @param user User object
     * @param room Room object
     * @param ability Ability
     * @param source Source Token
     * @param target Target Token
     */
    async ability(user: User, room: Room, ability: Ability, source: TokenMetadata, target: TokenMetadata | TokenMetadata[]) {
        try {
            const message = {
                wallet: user.wallet,
                ability,
                source,
                target
            };
            const data = compressData(JSON.stringify(message))
            room.send('ability', data);
        } catch (error) {
            console.error(error)
        }
    },

    /**
     * Purchase Shop Item
     * @param shopItemPayload Shop Item Payload
     * @returns ShopItemPayload
     */
    async purchaseShopItem(shopItemPayload: ShopItemPayload) {
        const path = `${domain}/purchase-shop-item`;
        return new Promise<any>( async (resolve, reject) => {
            try {
                const res = await Env.externalRequest(path).post(path, shopItemPayload)
                resolve(res.data);                
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get Purchases for Connected Wallet
     * @param user User object
     * @returns ShopItem[]
     */
    async getPurchases(user: User) {
        const path = `${domain}/player-purchases`;
        return new Promise<ShopItem[]>( async (resolve, reject) => {
            try {
                const res = await Env.externalRequest(path).post(path, { wallet: user.wallet })
                resolve(res.data);                
            } catch (error) {
                reject(error);
            }
        });
    }

}

export default ColosseumService;