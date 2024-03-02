
import Env from '../Env';
import { TopPlayers } from '../interfaces/Leaderboard.interface';
import { ShopItem } from '../interfaces/ShopItem.interface';

const SupabaseService = {

    /**
     * Get Top Three Players
     * @returns TopPlayers[]
     */
    async getTopPlayers() {
        return new Promise<TopPlayers[]>((resolve, reject) => {
            Env.apiRequest('GET', `/rest/v1/rpc/leaderboard`).then((res: TopPlayers[]) => {
                resolve(res);
            }).catch((err: any) => {
                reject(err);
            });
            
        })
    },

    /**
     * Get Shop Items
     * @returns ShopItem[]
     */
    async getShopItems() {
        return new Promise<ShopItem[]>((resolve, reject) => {
            Env.apiRequest('GET', `/rest/v1/rpc/shop`).then((res: any) => {
                resolve(res);
            }).catch((err: any) => {
                reject(err);
            });
            
        })
    },

}

export default SupabaseService;