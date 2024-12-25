import { config } from "dotenv";
import App, { loadConfigFromEnv } from "./src/app";

// config .env
config();
const app = new App(loadConfigFromEnv());

app.setup();
app.run();
