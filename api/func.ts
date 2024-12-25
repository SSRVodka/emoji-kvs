import App, { loadConfigFromEnv } from "../src/app";
import type { VercelRequest, VercelResponse } from '@vercel/node';


// Export the app as a serverless function
export default (req: VercelRequest, res: VercelResponse) => {
    const app = new App(loadConfigFromEnv());

    app.setup();
    app.serverless_function(req, res);
};
