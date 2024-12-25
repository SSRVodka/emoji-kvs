
import mongoose, { Model, Schema, model } from 'mongoose';
import StorageInterface, { StorageConfig, StorageResp, StorageRespCode } from '../store';
import { Logger } from '../../utils/logger';

const keyValueSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});
const kv = model('kv', keyValueSchema);


export default class MongoStorageClient implements StorageInterface<string, string> {
    
    client: mongoose.Mongoose | null = null;
    logger: Logger;

    constructor() {
        this.logger = new Logger("MongoDB Client");
    }

    async connect(config: StorageConfig) {
        if (!config.db_user || !config.db_pwd) {
            this.logger.error("DB_USER & DB_PWD is required");
            throw Error("[ MongoDB Client Error ] DB_USER & DB_PWD is required");
        }
        let conn_str = `mongodb+srv://${config.db_user}:${encodeURIComponent(config.db_pwd)}@${config.db_host}`;
        if (config.db_port) {
            conn_str += ":" + String(config.db_port);
        }
        conn_str += "/";
        if (config.db_name) {
            conn_str += config.db_name;
        }
        conn_str += "?retryWrites=true&w=majority";
        try {
            this.logger.info(`connecting to: mongodb+srv://${config.db_user}:******@${config.db_host}`
                + `${config.db_port ? `:${config.db_port}` : ""}/${config.db_name ? config.db_name : ""}`
                + "?retryWrites=true&w=majority");
            this.client = await mongoose.connect(conn_str);
        } catch (err: any) {
            this.logger.error(`${err}`);
            throw Error(err);
        }
    }
    disconnect() {
        this.client?.disconnect();
    }

    getClientInstance(): mongoose.Mongoose {
        if (this.client === null) {
            throw Error("mongodb client connection instance uninitialized");
        }
        return this.client as mongoose.Mongoose;
    }
    
    async addKeyValue(scope: string, key: string, value: string): Promise<StorageResp<null>> {
        return this.updateKeyValue(scope, key, value);
    }
    async updateKeyValue(scope: string, key: string, value: string): Promise<StorageResp<null>> {
        try {
            key = `${key}-${scope}`;
            const result = await kv.findOneAndUpdate(
                { key },
                { value },
                { new: true, upsert: true } // `new: true` returns the updated document
            );
            return {code: StorageRespCode.OK, message: "add/update OK"};
        } catch (err) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${err}`};
        }
    }
    async getValue(scope: string, key: string): Promise<StorageResp<string>> {
        key = `${key}-${scope}`;
        const result = await kv.findOne({ key });
        if (!result) {
            return {code: StorageRespCode.NOT_EXISTS, message: `Key "${key}" not found.`};
        }
        return {code: StorageRespCode.OK, data: result.value, message: "get OK"};
    }

    async getAllKeys(scope: string): Promise<StorageResp<string[]>> {
        try {
            const keys = await kv.find({}, 'key');  // Only return the key field
            const keyStrs = [];
            for (const key of keys) {
                if (key.key.endsWith(scope))
                    keyStrs.push(key.key.substring(0, key.key.length - 2 - scope.length));
            }
            return {code: StorageRespCode.OK, data: keyStrs, message: "get OK"};
        } catch (error) {
            return {code: StorageRespCode.UNKNOWN_ERROR, message: `${error}`};
        }
    }

    async deleteKey(scope: string, key: string): Promise<StorageResp<null>> {
        key = `${key}-${scope}`;
        const result = await kv.deleteOne({ key });
        if (result.deletedCount === 0) {
            return {code: StorageRespCode.NOT_EXISTS, message: `Key "${key}" not found`};
        }
        return {code: StorageRespCode.OK, message: "delete OK"};
    }
};

