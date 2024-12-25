
export class Logger {

    scope: string;
    constructor(scope: string) {
        this.scope = scope;
    }
    now(): string {
        return (new Date()).toISOString();
    }
    debug(msg: string) {
        console.debug(`[ ${this.scope} ] [ DEBUG ] [ ${this.now()} ] ${msg}`);
    }
    info(msg: string) {
        console.info(`[ ${this.scope} ] [ INFO  ] [ ${this.now()} ] ${msg}`);
    }
    warn(msg: string) {
        console.warn(`[ ${this.scope} ] [ WARN  ] [ ${this.now()} ] ${msg}`);
    }
    error(msg: string) {
        console.error(`[ ${this.scope} ] [ ERROR ] [ ${this.now()} ] ${msg}`);
    }
};
