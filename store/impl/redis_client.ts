
import { createClient, RedisClientType } from 'redis';
import StorageInterface, { StorageResp, StorageRespCode } from '../store';


export class RedisStoreClient implements StorageInterface<string, string> {

    client: RedisClientType | null = null;

    connect(host: string, port: number, password?: string) {
        // Create and configure the Redis client
        this.client = createClient({
            url: `redis://${host}:${port}`,
            password: password
        });
        
        this.client.on('error', (err) => {
            console.error('[ Redis Client Error ]', err);
            throw Error(err);
        });
        
        // Connect to Redis
        this.client.connect();
    }
    disconnect() {
        this.client?.disconnect();
    }

    getClientInstance(): RedisClientType {
        if (this.client === null) {
            throw Error("redis client connection instance uninitialized");
        }
        return this.client as RedisClientType;
    }

    async addKeyValue(key: string, value: string): Promise<StorageResp<null>> {
        try {
            await this.getClientInstance().set(key, value);
            return {code: StorageRespCode.OK, message: "add OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }

    // async addKeyValue(key: string, value: string): Promise<StorageResp> {
        
    // }
    async updateKeyValue(key: string, value: string): Promise<StorageResp<null>> {
        try {
            const existingValue = await this.getClientInstance().get(key);
            if (existingValue !== null) {
                await this.getClientInstance().set(key, value);
                return {code: StorageRespCode.OK, message: "update OK"};
            }
            return {code: StorageRespCode.NOT_EXISTS, message: `${key} not exists`};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async getValue(key: string): Promise<StorageResp<string>> {
        try {
            const value = await this.getClientInstance().get(key);
            if (value) return {code: StorageRespCode.OK, data: value, message: "get OK"};
            else return {code: StorageRespCode.NOT_EXISTS, message: `${key} not exists`};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async getAllKeys(): Promise<StorageResp<string[]>> {
        try {
            const keys = await this.getClientInstance().keys('*');
            return {code: StorageRespCode.OK, data: keys, message: "get OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async deleteKey(key: string): Promise<StorageResp<null>> {
        try {
            const result = await this.getClientInstance().del(key);
            return {code: result > 0 ? StorageRespCode.OK : StorageRespCode.NOT_EXISTS, message: "delete OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
};

