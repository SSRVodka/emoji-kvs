
export enum StorageRespCode {
    OK,
    INVALID_ARG,
    ALREADY_EXISTS,
    NOT_EXISTS,

    NETWORK_ERROR,
    UNKNOWN_ERROR
};

export interface StorageResp<V> {
    code: StorageRespCode;
    data?: V;
    message: string;
};

export interface StorageConfig {
    db_host: string;
    db_port?: number;
    db_user?: string;
    db_pwd?: string;
    db_name?: string;
};

export default interface StorageInterface<K, V> {

    connect(config: StorageConfig): void | Promise<void>;
    disconnect(): void | Promise<void>;

    addKeyValue(scope: string, key: K, value: V): Promise<StorageResp<null>>;
    updateKeyValue(scope: string, key: K, value: V): Promise<StorageResp<null>>;
    getValue(scope: string, key: K): Promise<StorageResp<V>>;
    getAllKeys(scope: string): Promise<StorageResp<K[]>>;
    deleteKey(scope: string, key: K): Promise<StorageResp<null>>;
};

