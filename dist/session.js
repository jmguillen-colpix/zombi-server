var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config = require("./config");
const utils = require("./utils");
const log = require("./log");
// const db      = require("./db/db");
const cache = require("./cache");
const crypto = require("crypto");
const moment = require('moment');
// var session_data = {};
const check = (token) => __awaiter(this, void 0, void 0, function* () {
    const data = yield cache.hgetall(config.session.cache_prefix + token);
    console.log("session data", data);
    return (data !== null && data.authenticated && data.authenticated === "true");
    // return (session_data[token] && session_data[token].authenticated && session_data[token].authenticated === true);
});
const update = (token) => __awaiter(this, void 0, void 0, function* () {
    return yield cache.hset(config.session.cache_prefix + token, "updated", utils.timestamp());
});
const create = (token, user_id, language, timezone, full_name, is_admin) => __awaiter(this, void 0, void 0, function* () {
    try {
        if (token) {
            const timestamp = utils.timestamp();
            const data = {
                "authenticated": true,
                "language": language,
                "user_id": user_id,
                "timezone": timezone,
                "full_name": full_name,
                "is_admin": is_admin,
                "created": timestamp,
                "updated": timestamp
            };
            console.log("session create", data);
            yield cache.hmset(config.session.cache_prefix + token, data);
            log("Session created for token " + utils.make_token_shorter(token), "sessions/create");
        }
        else {
            log("Cannot create session, empty token", "session/create");
        }
    }
    catch (error) {
        log("Cannot create session", "session/start", true);
        throw ("Cannot create session");
    }
});
const destroy = (token) => __awaiter(this, void 0, void 0, function* () {
    try {
        const sockets = require("./sockets");
        sockets.send_message_to_session(token, "ZOMBI_SERVER_SESSION_EXPIRED");
        yield cache.del(config.session.cache_prefix + token);
        log("Deleted session with token " + utils.make_token_shorter(token), "sessions/destroy");
    }
    catch (error) {
        log(error.message, "session/destroy", true);
        throw (error);
    }
});
const expire = () => __awaiter(this, void 0, void 0, function* () {
    try {
        const limit = Math.floor(new Date() / 1000) - config.session.expire;
        const keys = yield cache.keys(config.session.cache_prefix);
        keys.forEach((key) => __awaiter(this, void 0, void 0, function* () {
            const updated = yield cache.hget(key, "updated");
            if (updated === null || (parseInt(updated) < limit)) {
                const parts = key.split(":");
                const token = parts[1];
                log("Expired session token " + utils.make_token_shorter(token) + " inactive since " + moment.utc(limit, "X").format("LLL") + " (UTC), " + Math.floor(config.session.expire / 60) + " minutes ago", "session/expire");
                yield destroy(token);
            }
        }));
    }
    catch (error) {
        log(error.message, "session/expire", true);
    }
});
const get = (token, key) => __awaiter(this, void 0, void 0, function* () {
    return yield cache.hget(config.session.cache_prefix + token, key);
});
const set = (token, key, value) => __awaiter(this, void 0, void 0, function* () {
    return yield cache.hset(config.session.cache_prefix + token, key, value);
});
const token = () => {
    return crypto.randomBytes(config.security.token_size).toString("hex").toUpperCase();
};
module.exports = {
    destroy,
    set,
    get,
    check,
    token,
    create,
    expire,
    update
};
