const config  = require("./config");
const utils   = require("./utils");
const log     = require("./log");
// const db      = require("./db/db");

const cache   = require("./cache");


const crypto = require("crypto");
const moment = require('moment');

// var session_data = {};

const check = async token => {

    const data = await cache.hgetall(config.session.cache_prefix + token);

    console.log("session data", data);

    return (data !== null && data.authenticated && data.authenticated === "true");

    // return (session_data[token] && session_data[token].authenticated && session_data[token].authenticated === true);

};

const update = async token => {

    return await cache.hset(config.session.cache_prefix + token, "updated", utils.timestamp());

};

const create = async (token, user_id, language, timezone, full_name, is_admin) => {

    try {

        if(token) {

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

            await cache.hmset(config.session.cache_prefix + token, data);

            log("Session created for token " + utils.make_token_shorter(token), "sessions/create");

        } else { log("Cannot create session, empty token", "session/create"); }

    } catch (error) {

        log("Cannot create session", "session/start", true);

        throw("Cannot create session");
        
    }

};

const destroy = async (token) => {

    try {

        const sockets = require("./sockets");

        sockets.send_message_to_session(token, "ZOMBI_SERVER_SESSION_EXPIRED");

        await cache.del(config.session.cache_prefix + token);

        log("Deleted session with token " + utils.make_token_shorter(token), "sessions/destroy");
        
    } catch (error) {

        log(error.message, "session/destroy", true);

        throw(error);
        
    }

};

const expire = async () => {

    try {

        const limit = Math.floor(new Date() / 1000) - config.session.expire;

        const keys = await cache.keys(config.session.cache_prefix);

        keys.forEach(async key => {

            const updated = await cache.hget(key, "updated");

            if(updated === null || (parseInt(updated) < limit)) {

                const parts = key.split(":");

                const token = parts[1];

                log("Expired session token " + utils.make_token_shorter(token) + " inactive since " + moment.utc(limit, "X").format("LLL") + " (UTC), " + Math.floor(config.session.expire / 60) + " minutes ago", "session/expire");

                await destroy(token);

            }
            
        });
        
    } catch (error) {

        log(error.message, "session/expire", true);
        
    }

};

const get = async (token, key) => {

    return await cache.hget(config.session.cache_prefix + token, key);

};

const set = async (token, key, value) => {

    return await cache.hset(config.session.cache_prefix + token, key, value);

};

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