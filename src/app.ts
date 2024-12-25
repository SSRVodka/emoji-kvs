// src/index.ts
import express from 'express';
import { RedisStoreClient } from '../store/impl/redis_client';

import DataType from '../types/data_type';


export interface AppConfig {
  db_host: string;
  db_port: number;
  db_user?: string;
  db_pwd?: string;

  resource_endpoints: string[];
  server_port: number;
};


export default class App {

  config: AppConfig;
  redis_client: RedisStoreClient;
  server: express.Express;
  port: number;

  constructor(config: AppConfig) {
    this.config = config;
    this.redis_client = new RedisStoreClient();
    this.server = express();
    this.port = config.server_port;
  }

  register_resource(resource_name: string) {
    // Endpoint to add a key-value pair
    this.server.post(`/${resource_name}`, async (req, res) => {
      const { key, val: value } = req.body as DataType;
      if (!key || !value) {
        res.status(400).send('Both key and value are required.');
      }
      const message = await this.redis_client.addKeyValue(key, value);
      console.log(`[ App ] add kv: ${key}::${value}`);
      res.status(200).send(message);
    });

    // Endpoint to update a key-value pair
    this.server.put(`/${resource_name}`, async (req, res) => {
      const { key, val: value } = req.body as DataType;
      if (!key || !value) {
        res.status(400).send('Both key and value are required.');
      }
      const message = await this.redis_client.updateKeyValue(key, value);
      console.log(`[ App ] update kv: ${key}::${value}`);
      res.status(200).send(message);
    });

    // Endpoint to get the value by key
    this.server.get(`/${resource_name}/:key`, async (req, res) => {
      const { key } = req.params;
      const value = await this.redis_client.getValue(key);
      console.log(`[ App ] get kv: ${key} -> ${value}`);
      res.status(200).send(value);
    });

    // Endpoint to get all keys
    this.server.get(`/${resource_name}/keys`, async (req, res) => {
      const keys = await this.redis_client.getAllKeys();
      console.log(`[ App ] get keys: ${keys}`);
      res.status(200).json(keys);
    });

    // // Endpoint to delete a key-value pair
    // this.server.delete('/delete/:key', async (req, res) => {
    //   const { key } = req.params;
    //   const message = await this.redis_client.deleteKey(key);
    //   res.status(200).send(message);
    // });
  }

  setup() {

    // set connection
    this.redis_client.connect(this.config.db_host, this.config.db_port, this.config.db_pwd);

    // Middleware to parse JSON bodies
    this.server.use(express.json());

    for (const res of this.config.resource_endpoints) {
      this.register_resource(res);
    }

    this.server.listen(this.port, () => {
      console.log(`Key-Value store server running at http://localhost:${this.port}`);
    });
  }

};

