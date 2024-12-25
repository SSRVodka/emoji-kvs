import { config } from "dotenv";
import App from "./src/app";

// config .env
config();

const port = parseInt(process.env.SERVER_PORT || "3000");
const db_port = parseInt(process.env.DB_PORT || "6379");
const db_host = process.env.DB_HOST || "localhost";
const db_pwd = process.env.DB_PWD || undefined;

const app = new App({
    db_host: db_host,
    db_port: db_port,
    db_pwd: db_pwd,
    server_port: port,
    resource_endpoints: [
        "emoji"
    ]
});

app.setup();
