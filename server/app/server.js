
const log = require("./log");
const session = require("./session");
const stats = require("./stats");
const security = require("./security");
const utils = require("./utils");
const i18n = require("./i18n");

const path = require("path");

const execute = async (mod, fun, args, token, sequence, ip, ua) => {

    try {

        log(`Executing ${mod}/${fun} with token ${utils.make_token_shorter(token)}`, "server/execute");

        const is_login = (mod === "sys_login" && ["login", "logoff"].includes(fun));
        const is_start = (mod === "sys_login" && fun === "start");

        if (is_login) {

            return run(mod, fun, args, token, sequence, ip, ua);

        } else {

            if (token) {

                await session.update(token);

                if(
                    await session.check(token) &&
                    (is_start || await security.authorize(token, mod))
                ) {
                    return run(mod, fun, args, token, sequence, ip, ua);
                } else {
                    return response({ error: true, message: await i18n.label(token, "YOU_ARE_NOT_AUTHORIZED"), sequence });
                }
                
            } else {

                return response({ error: true, message: "Cannot execute without a invalid token", sequence, expired: true });

            }

        }

    } catch (error) {
        log(error.message, "server/execute", true);

        return response(true, error.message, null, seq);
    }
};

const run = async (mod, fun, args, token, sequence, ip, ua) => {

    try {
        const start_time = new Date();

        const module_path = path.join(__dirname, "../face/" + mod + ".js");

        log(`Loading module file ${module_path}`, "server/run");

        const action = require(module_path);

        if (typeof action[fun] === "function") {
            const [error, data, message] = await action[fun](args, { token, sequence });

            if (typeof error === "undefined") {
                stats.eup();

                log(`Invalid response from action function ${mod}/${fun}`, "server/run", true);

                return response({ error: true, message: `Invalid response from action function ${mod}/${fun}`, sequence });
            } else {
                const elapsed = new Date() - start_time;

                stats.tup(elapsed);

                return response({ error, message, data, sequence, elapsed });
            }
        } else {
            stats.eup();

            log(`Function [${fun}] is not defined on module [${mod}]`, "server/run", true);

            return response(true, `Function [${fun}] is not defined on module [${mod}]`, null, sequence);
        }
    } catch (error) {
        log(error, "server/run", true);

        throw (error);
    }
}

const response = ({ error = false, message = "ok", data = {}, sequence, elapsed = -1, expired = false }) => {
    
    log(`Server response time: ${elapsed} ms`, "server/execute");

    return { error, message, data, info: { time: elapsed, sequence, expired } };
};

module.exports = { execute, response };
