"use strict";

const config   = require("./config");
const log      = require("./log");
const session  = require("./session");
const stats    = require("./stats");
const security = require("./security");
const utils    = require("./utils");
const i18n     = require("./i18n");

const path   = require("path");
const fs     = require("fs");

const mime = (ext) => {

    // TODO add more MIME types
    const mime_types = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.eot': 'appliaction/vnd.ms-fontobject',
        '.ttf': 'aplication/font-sfnt'
    };

    return mime_types[ext];

};

const execute = async (mod, fun, args, token, seq, ip, ua) => {

    try {

        log(`Executing ${mod}/${fun} with token ${utils.make_token_shorter(token)}`, "server/execute");

        if(token) {

            await session.update(token);

            await session.check(token);

            await security.authorize(token, mod);

            return await run(mod, fun, args, token, seq, ip, ua);

        } else {

            const is_login = (mod === "sys_login" && ["login", "logoff", "start"].includes(fun));

            if(is_login) {

                return await run(mod, fun, args, token, seq, ip, ua);

            } else {

                log(`Trying to execute ${mod}/${fun} without token`, "server/execute", true);

                return response(true, "Not authorized", null, seq, -1, true);

            }

        }
        
    } catch (error) {

        log(error.message, "server/execute", true);

        return response(true, error.message, null, seq, -1, error.message === "INVALID_SESSION");
        
    }

};

const run = async (mod, fun, args, token, seq, ip, ua) => {

    try {

        const start_time = new Date();

        const module_path = path.join(__dirname, "../face/" + mod + ".js");

        log(`Loading module file ${module_path}`, "server/run");

        const action = require(module_path);

        if(typeof action[fun] === "function") {

            const [error, data, message] = await action[fun](args, {token: token, sequence: seq});

            if(typeof error === "undefined") {

                stats.eup();

                log(`Invalid response from action function ${mod}/${fun}`, "server/run", true);

                return response(true, `Invalid response from action function ${mod}/${fun}`, seq);


            } else {

                const elapsed = new Date() - start_time;

                stats.tup(elapsed);

                return response(error, message, data, seq, elapsed);

            }

        } else {

            stats.eup();

            log(`Function [${fun}] is not defined on module [${mod}]`, "server/run", true);

            return response(true, `Function [${fun}] is not defined on module [${mod}]`, null, seq);

        }

    } catch (error) {

        log(error, "server/run", true);

        throw(error);
        
    }

}

const response = (error, message, data, sequence, elapsed = -1, expired = false) => {

    const e = (error === false) ? false : true;
    const m = (typeof message === "undefined") ? "ok" : message;
    const d = (typeof data === "undefined") ? {} : data;
    const i = {time: elapsed, sequence: sequence, expired: expired};

    log(`Server response time: ${elapsed} ms`, "server/execute");

    return {error: e, message: m, data: d, info: i};
    
};

module.exports = { execute, response, mime };

