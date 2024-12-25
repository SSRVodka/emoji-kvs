// src/index.ts
import express from 'express';
import { RedisStoreClient } from './store/impl/redis_client';

import DataType from './types/data_type';
import { IncomingMessage, ServerResponse } from 'http';

import cors from 'cors';  // Import cors middleware
import StorageInterface, { StorageConfig } from './store/store';
import MongoStorageClient from './store/impl/mongo_client';
import { Logger } from './utils/logger';


export enum AppSupportedStorageClient {
  MONGODB,
  REDIS
};

function str2assc(c: string): AppSupportedStorageClient {
  switch (c) {
  case "MONGODB": return AppSupportedStorageClient.MONGODB;
  case "REDIS": return AppSupportedStorageClient.REDIS;
  default:
    throw new Error(`unsupported client type: ${c}`);
  }
}

export interface AppConfig extends StorageConfig {
  
  client_type: string;

  resource_endpoints: string[];
  server_port: number;

  cors_options: cors.CorsOptions;
};

export function loadConfigFromEnv(): AppConfig {
  const port = parseInt(process.env.SERVER_PORT || "3000");
  const db_port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined;
  const db_host = process.env.DB_HOST || "localhost";
  const db_user = process.env.DB_USER || "root";
  const db_pwd = process.env.DB_PWD || undefined;
  const db_name = process.env.DB_NAME || "";
  const cors_origin = process.env.CORS_ORIGIN || "localhost";

  const endpoints = (process.env.ENDPOINTS || "").split(",").filter((v)=>v&&v.length!==0);

  const db_type = process.env.DB_TYPE?.toUpperCase() || "REDIS";

  return {
    db_host: db_host,
    db_port: db_port,
    db_user: db_user,
    db_pwd: db_pwd,
    db_name: db_name,
    client_type: db_type,

    server_port: port,
    resource_endpoints: endpoints,
    cors_options: {
        origin: cors_origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']
    }
  };
}


export default class App {

  config: AppConfig;
  client: StorageInterface<string, string>;
  server: express.Express;
  port: number;

  is_setup: boolean;

  logger: Logger;

  constructor(config: AppConfig) {
    this.config = config;
    this.logger = new Logger("App");

    this.is_setup = false;
    
    switch (str2assc(config.client_type)) {
    case AppSupportedStorageClient.REDIS:
      this.client = new RedisStoreClient();
      break;
    case AppSupportedStorageClient.MONGODB:
      this.client = new MongoStorageClient();
      break;
    }

    this.server = express();
    this.port = config.server_port;
  }

  register_resource(resource_name: string) {

    if (resource_name === "__keys") {
      throw Error("reserved word: __keys");
    }

    this.logger.info(`registering resource (endpoint): ${resource_name}`);

    // Endpoint to add a key-value pair
    this.server.post(`/${resource_name}`, async (req, res) => {
      let { key, val: value } = req.body as DataType;
      if (!key || !value) {
        res.status(400).send('Both key and value are required.');
      }
      const message = await this.client.addKeyValue(resource_name, key, value);
      this.logger.info(`add kv: ${key}::${value}`);
      res.status(200).send(message);
    });

    // Endpoint to update a key-value pair
    this.server.put(`/${resource_name}`, async (req, res) => {
      let { key, val: value } = req.body as DataType;
      if (!key || !value) {
        res.status(400).send('Both key and value are required.');
      }
      const message = await this.client.updateKeyValue(resource_name, key, value);
      this.logger.info(`update kv: ${key}::${value}`);
      res.status(200).send(message);
    });

    // Endpoint to get all keys
    // Debug only
    this.server.get(`/__keys/${resource_name}`, async (req, res) => {
      const keys = await this.client.getAllKeys(resource_name);
      this.logger.info(`get keys: ${keys}`);
      res.status(200).json(keys);
    });

    // Endpoint to get the value by key
    this.server.get(`/${resource_name}/:key`, async (req, res) => {
      let { key }: { key: string } = req.params;
      const value = await this.client.getValue(resource_name, key);
      this.logger.info(`get kv: ${key} -> ${value.data}`);
      res.status(200).send(value);
    });

    // // Endpoint to delete a key-value pair
    // this.server.delete('/delete/:key', async (req, res) => {
    //   const { key } = req.params;
    //   const message = await this.client.deleteKey(key);
    //   res.status(200).send(message);
    // });
  }

  setup() {
    if (this.is_setup) return;
    
    // set connection
    this.client.connect(this.config);

    this.server.use(cors(this.config.cors_options));  // Apply the CORS configuration

    // Middleware to parse JSON bodies
    this.server.use(express.json());

    if (this.config.resource_endpoints.length === 0) {
      this.logger.warn("empty resource list. No endpoint will be registered");
    }
    for (const res of this.config.resource_endpoints) {
      this.register_resource(res);
    }
    this.is_setup = true;
  }

  run() {
    this.setup();
    this.server.listen(this.port, () => {
      this.logger.debug(`server running at http://localhost:${this.port}`);
    });
  }

  serverless_function(req: IncomingMessage, res: ServerResponse): void {
    this.server(req, res);
  }

};

