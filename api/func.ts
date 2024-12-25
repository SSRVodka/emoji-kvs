import App, { loadConfigFromEnv } from "../src/app";
import { IncomingMessage, ServerResponse } from "http";


const app = new App(loadConfigFromEnv());

app.setup();

// Export the app as a serverless function
export default (req: IncomingMessage, res: ServerResponse) => {
    app.serverless_function(req, res);
};
