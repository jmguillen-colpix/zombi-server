const config   = require("./config");
const log      = require("./log");
const session  = require("./session");
const stats    = require("./stats");
const security = require("./security");
const i18n     = require("./i18n");

const path   = require('path');
const fs     = require('fs');

// Access log open
const access_file_path = path.join(__dirname, "../storage/logs/" + config.server.log.access_file_name);

var access_file_desc = false;

fs.open(access_file_path, 'a', function(err, fd) {

    if (err) {

        log(`Error opening: [${access_file_path}] ${err}`, "server/access_file_open", true);
    
    } else {

        log(`Log file: [${access_file_path}] opened`, "server/access_file_open");

        access_file_desc = fd;

    } 

});

const shutdown = () => {

    try {

        fs.close(access_file_desc, () => {

            access_file_desc = false;
    
            log("Access file closed", "server/access_file_close");
    
        });

    } catch(error) {

        log(error.message, "server/access_file_close");

    }

}

const access = (token, mod, fun, args, seq, ip, ua, elapsed) => {

    if(config.server.log.access_enabled && access_file_desc) { 

        try {

            const d = new Date();

            const t = d.toISOString();
        
            // TODO Are args needed here? They may have sensitive information...
            const m = t + "|" + elapsed + "|" + token + "|" + mod + "|" + fun + "|" + JSON.stringify(args) + "|" + seq + "|" + ip + "|" + ua;
        
            let buffer = Buffer.from(m + "\n");
        
            fs.write(access_file_desc, buffer, 0, buffer.length, null, (err) => {
    
                if (err) { log("Error writing access file", "server/access_write", true); }
    
            });

        } catch(error) { log(error.message, "server/access_write", true); }
    
    }

};

const execute = async (mod, fun, args, token, seq, ip, ua) => {

    try {

        const string_args = JSON.stringify(args);

        const trimmed_args = (string_args.length > 50) ? string_args.substring(0, 50)  + "..." : string_args;

        // We don't want the user password on the log file
        if(mod === "sys_login" && fun === "login") { log(`Executing ${mod}/${fun} ("${args[0]}","*********","${args[2]}")`, "server/execute"); }
        else { log(`Executing ${mod}/${fun} (${trimmed_args})`, "server/execute"); }

        if(token) {

            if(session.check(token)) {

                if(await security.authorize(token, mod)) {

                    return await _execute(mod, fun, args, token, seq, ip, ua);

                } else {

                    log(`User ${session.get(token, "full_name")} is not authorized for module ${mod}`, "server/execute", true);

                    return response(true, i18n.label(token, "YOU_ARE_NOT_AUTHORIZED"), null, seq);

                }

            } else {

                log(`Invalid session`, "server/execute", true);

                return response(true, "Invalid session", null, seq, -1, true);

            }

        } else {

            const is_login = (mod === "sys_login" && (fun === "login" || fun === "logoff" || fun === "start"));

            if(is_login) {

                return await _execute(mod, fun, args, token, seq, ip, ua);

            } else {

                log(`Trying to execute without token`, "server/execute", true);

                return response(true, "Not authorized", null, seq, -1, true);

            }

        }
        
    } catch (error) {

        log(error.message, "server/execute", true);

        throw(error);
        
    }

};

const _execute = async (mod, fun, args, token, seq, ip, ua) => {

    try {

        const start_time = new Date();

        const module_path = path.join(__dirname, "../server/face/" + mod + ".js");

        log(`Loading module file ${module_path}`, "server/execute");

        const action = require(module_path);

        if(typeof action[fun] === "function") {

            const [error, data, message] = await action[fun](args, {token: token, sequence: seq});

            if(typeof error === "undefined") {

                stats.eup();

                log(`Invalid response from action function ${mod}/${fun}`, "server/execute", true);

                return response(true, `Invalid response from action function ${mod}/${fun}`, seq);


            } else {

                const elapsed = new Date() - start_time;

                stats.tup(elapsed);

                access(token, mod, fun, args, seq, ip, ua, elapsed);

                return response(error, message, data, seq, elapsed);

            }

        } else {

            stats.eup();

            log(`Function [${fun}] is not defined on module [${mod}]`, "server/execute", true);

            return response(true, `Function [${fun}] is not defined on module [${mod}]`, null, seq);

        }

    } catch (error) {

        log(error.message, "server/_execute", true);

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

module.exports = { shutdown, execute, response, access };

