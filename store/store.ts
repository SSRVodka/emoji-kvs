
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

export default interface StorageInterface<K, V> {
    addKeyValue(key: K, value: V): Promise<StorageResp<null>>;
    updateKeyValue(key: K, value: V): Promise<StorageResp<null>>;
    getValue(key: K): Promise<StorageResp<V>>;
    getAllKeys(): Promise<StorageResp<K[]>>;
    deleteKey(key: K): Promise<StorageResp<null>>;
};

