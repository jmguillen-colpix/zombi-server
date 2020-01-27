"use strict";

const log = require("./log");
const session = require("./session");
const stats = require("./stats");
const security = require("./security");
const utils = require("./utils");

const path = require("path");

const execute = async (mod, fun, args, token, sequence, ip, ua) => {

    log(`Executing ${mod}/${fun} with token ${utils.make_token_shorter(token)}`, "server/execute");

    const is_login = (mod === "sys_login" && ["login", "logoff"].includes(fun));
    const is_start = (mod === "sys_login" && fun === "start");

    if (is_login) {

        return run(mod, fun, args, token, sequence, ip, ua);

    } else {

        if (token) {

            await session.update(token);

            if(await session.check(token)) {

                if(is_start || await security.authorize(token, mod)) {
    
                    return run(mod, fun, args, token, sequence, ip, ua);
    
                } else {
    
                    return response({ 
                        error: true, 
                        code: 1000,
                        message: "Not authorized", 
                        sequence 
                    });
    
                }

            } else {

                return response({ 
                    error: true,
                    code: 1001,
                    message: "Session expired", 
                    sequence
                });

            }

        } else {

            return response({ 
                error: true,
                code: 1001,
                message: "Invalid token", 
                sequence
            });

        }

    }

};

// TODO do something useful with ip and ua
const run = async (mod, fun, args, token, sequence, ip, ua) => {

    /* 
        Error codes reference
        1000 Not authorized
        1001 Invalid token/Session expired
        1002 Invalid response from action function ${mod}/${fun}
        1003 Function [${fun}] is not defined on module [${mod}]
        1004 Cannot login
        1005 Invalid language
    */

    const start_time = new Date();

    const module_path = path.join(__dirname, "../frontend/" + mod + ".js");

    log(`Loading module file ${module_path}`, "server/run");

    const action = require(module_path);

    if (typeof action[fun] === "function") {

        let error, data, message, code;

        const results = await action[fun](args, { token, sequence });

        if (Array.isArray(results)) {

            [error, data, message, code] = results;

        } else {

            error = results.error;
            code = results.code;
            data = results.data;
            message = results.message;

        }

        if (typeof error === "undefined" && typeof code === "undefined" && typeof data === "undefined") {

            stats.eup();

            log(`Invalid response from action function ${mod}/${fun}`, "server/run", true);

            return response({ 
                error: true, 
                code: 1002,
                message: `Invalid response from action function ${mod}/${fun}`, 
                sequence 
            });

        } else {

            const elapsed = new Date() - start_time;

            stats.tup(elapsed);

            return response({ error, code, message, data, sequence, elapsed });

        }

    } else {

        stats.eup();

        log(`Function [${fun}] is not defined on module [${mod}]`, "server/run", true);

        return response({ 
            error: true, 
            code: 1003,
            message: `Function [${fun}] is not defined on module [${mod}]`, 
            sequence 
        });

    }

}

const response = ({ error = false, code = 0, message = "ok", data = {}, sequence = 0, elapsed = -1 }) => {
    
    log(`Server response: code ${code}, time: ${elapsed} ms`, "server/execute");

    return { error, code, message, data, info: { time: elapsed, sequence } };
};

module.exports = { execute, response };
