const config  = require("./config");
const utils   = require("./utils");
const log     = require("./log");
const db      = require("./db/db");


const crypto = require("crypto");
const moment = require('moment');

var session_data = {};

const check = (token) => {

    return (session_data[token] && session_data[token].authenticated && session_data[token].authenticated === true);

};

const start = async token => {

    try {

        const session_base = {
            user_id: -1,
            full_name: "unknonwn",
            timezone: config.i18n.timezone,
            language: config.i18n.lang
        };
    
        if(token) {
    
            const data = await db.sql(`select session_data from ${db.table_prefix()}sessions where token = :token`, [token]);
            
            if(data.rows.length === 1) {
    
                const sess_data = JSON.parse(data.rows[0][0]);
    
                session_data[token] = { ...session_base, ...sess_data };
    
                log(`Session started for token ${utils.make_token_shorter(token)}`, "sessions/start");
    
                return true;
    
            } else {
    
                log("Session not found", "session/start");
    
                return false;
                
            }
    
        } else {
            
            log("Token not found", "session/start");
            
            return false;
        
        }

        
    } catch (error) {

        log("Cannot create session", "session/start", true);

        throw("Cannot create session");
        
    }

};

const create = async (token, user_id, language, timezone, full_name, is_admin) => {

    try {

        if(token) {

            const data = {
                "authenticated": true, 
                "language": language, 
                "user_id": user_id, 
                "timezone": timezone,
                "full_name": full_name,
                "is_admin": is_admin
            };

            const timestamp = utils.timestamp();

            await db.sql(
                `insert into ${db.table_prefix()}sessions (token, session_data, user_id, created, updated) values (:token, :session_data, :user_id, :created, :updated)`,
                [token, JSON.stringify(data), user_id, timestamp, timestamp]
            );

            log("Session created for token " + utils.make_token_shorter(token), "sessions/create");

        } else { log("Cannot create session, empty token", "session/create"); }

    } catch (error) {

        log("Cannot create session", "session/start", true);

        throw("Cannot create session");
        
    }

};

const save = async token => {

    try {

        if(token && session_data[token]) {

            await db.sql(
                `update ${db.table_prefix()}sessions set session_data = :session_data, updated = :updated where token = :token`,
                [JSON.stringify(session_data[token]), utils.timestamp(), token]
            ); 

            log("Session saved for token " + utils.make_token_shorter(token), "sessions/save");
    
        } else {
            
            log("Cannot save, empty token", "session/save");
        
        }
        
    } catch (error) {

        log(error, "session/save", true);

        throw(error);
        
    }

};

const destroy = async (token) => {

    try {

        const sockets = require("./sockets");

        sockets.send_message_to_session(token, "ZOMBI_SERVER_SESSION_EXPIRED");

        delete session_data[token];

        await db.sql(
            `delete from ${db.table_prefix()}sessions where token = :token`,
            [token]
        );

        log("Deleted session with token " + utils.make_token_shorter(token), "sessions/destroy");
        
    } catch (error) {

        log(error.message, "session/destroy", true);

        throw(error);
        
    }

};

const expire = async () => {

    try {

        const limit = Math.floor(new Date() / 1000) - config.session.expire;

        const reply = await db.sql(`select token from ${db.table_prefix()}sessions where updated < :limit`, [limit]);

        for (const row of reply.rows) {

            const token = row[0];

            await destroy(token);

            log("Expired session token " + utils.make_token_shorter(token) + " inactive since " + moment.utc(limit, "X").format("LLL") + " (UTC), " + Math.floor(config.session.expire / 60) + " minutes ago", "session/expire");
            
        }
        
    } catch (error) {

        log(error.message, "session/expire", true);

        throw(error);
        
    }

};

const get = (token, key) => {

    if(token && session_data[token] && typeof session_data[token][key] !== "undefined") {

        return session_data[token][key];    

    } else {

        log("Unable to get session value for key " + key, "session/get", true);

        return null;

    }

};

const set = (token, key, value) => {

    if(session_data[token]) {

        session_data[token][key] = value;

        return true;

    } else { return false; }

};

const token = () => {

    return crypto.randomBytes(config.security.token_size).toString("hex").toUpperCase();

};

module.exports = {
    start,
    destroy,
    set,
    get,
    check,
    token,
    save,
    create,
    expire
};