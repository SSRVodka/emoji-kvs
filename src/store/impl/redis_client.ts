
import { createClient, RedisClientType } from 'redis';
import StorageInterface, { StorageConfig, StorageResp, StorageRespCode } from '../store';
import { Logger } from '../../utils/logger';


export class RedisStoreClient implements StorageInterface<string, string> {

    client: RedisClientType | null = null;
    logger: Logger;

    constructor() {
        this.logger = new Logger("Redis Client");
    }

    connect(config: StorageConfig) {
        // Create and configure the Redis client
        let conn_str = `redis://${config.db_host}`;
        if (config.db_port) {
            conn_str += `:${config.db_port}`;
        }
        this.logger.info(`connecting to: ${conn_str}`);
        this.client = createClient({
            url: conn_str,
            password: config.db_pwd
        });
        
        this.client.on('error', (err) => {
            this.logger.error(`${err}`);
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

    async addKeyValue(scope: string, key: string, value: string): Promise<StorageResp<null>> {
        try {
            key = `${scope}:${key}`;
            await this.getClientInstance().set(key, value);
            return {code: StorageRespCode.OK, message: "add OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }

    // async addKeyValue(key: string, value: string): Promise<StorageResp> {
        
    // }
    async updateKeyValue(scope: string, key: string, value: string): Promise<StorageResp<null>> {
        try {
            key = `${scope}:${key}`;
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
    async getValue(scope: string, key: string): Promise<StorageResp<string>> {
        try {
            key = `${scope}:${key}`;
            const value = await this.getClientInstance().get(key);
            if (value) return {code: StorageRespCode.OK, data: value, message: "get OK"};
            else return {code: StorageRespCode.NOT_EXISTS, message: `${key} not exists`};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async getAllKeys(scope: string): Promise<StorageResp<string[]>> {
        try {
            let keys = await this.getClientInstance().keys(`${scope}:*`);
            keys = keys.map((k) => k.substring(1 + scope.length, k.length));
            return {code: StorageRespCode.OK, data: keys, message: "get OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async deleteKey(scope: string, key: string): Promise<StorageResp<null>> {
        try {
            key = `${scope}:${key}`;
            const result = await this.getClientInstance().del(key);
            return {code: result > 0 ? StorageRespCode.OK : StorageRespCode.NOT_EXISTS, message: "delete OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
};

