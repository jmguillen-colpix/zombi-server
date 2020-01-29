"use strict";

const config = require("./config");
const log = require("./log");
const db = require("./db/db");
const session = require("./session");
const cache = require("./cache");
const utils = require("./utils");
const stats = require("./stats");

const bcrypt = require("bcryptjs");
const path = require("path");
const url = require("url");

const sanitize_path = url_path => {
    // https://en.wikipedia.org/wiki/Directory_traversal_attack
    // eslint-disable-next-line node/no-deprecated-api, no-useless-escape
    return path.normalize(url.parse(url_path).pathname).replace(/^(\.\.[\/\\])+/, "");
}

const password_hash = password => {
    return bcrypt.hash(password, config.security.salt_rounds);
}

const password_compare = (password, hash) => {
    return bcrypt.compare(password, hash);
}

const user_is_admin = token => {
    // TODO Ok, does this belong to session? Maybe not.
    // TODO A better alternative might be something that is obtained (an cached) from users table data
    return session.get(token, "is_admin");
}

const authorize = async (token, mod) => {

    try {

        if (await user_is_admin(token) === "true") { 
            
            log.debug(`User with token ${utils.make_token_shorter(token)} is admin`, "security/authorize");

            return true; // You are already God, say no more

        } else {

            const user_id = await session.get(token, "user_id");

            const cache_auth = await cache.hget(`${config.security.user_cache_prefix}${user_id}`, mod);

            if(cache_auth === "yes") {

                stats.cup();

                log.debug(`Cache hit (yes) for user ID ${user_id} module ${mod}`, "security/authorize");

                return true;

            } else if(cache_auth === "no") {

                stats.cup();

                log.debug(`Cache hit (no) for user ID ${user_id} module ${mod}`, "security/authorize");

                return false;

            } else {

                stats.mup();

                const sql = `select count(*) from (select *
                            from
                                ${db.table_prefix()}users zou
                                    join ${db.table_prefix()}groups_to_users zog on (zou.id = zog.user_id)
                                    join ${db.table_prefix()}groups_to_modules zom on (zog.group_id = zom.group_id)
                            where 1=1
                                and zou.id = :user_id
                                and zom.module_name = :module_name) inq`;

                const reply = parseInt(await db.sqlv({ sql, bind: [user_id, mod] }));

                if (reply > 0) {

                    log.debug(`User with ID ${user_id} authorized on the database for [${mod}]`, "security/authorize");

                    if(config.security.user_cache_enabled) {

                        await cache.hset(`${config.security.user_cache_prefix}${user_id}`, mod, "yes");

                    }

                    return true;

                } else {

                    log.debug(`User with ID ${user_id} not authorized on the database for [${mod}]`, "security/authorize");

                    if(config.security.user_cache_enabled) {

                        await cache.hset(`${config.security.user_cache_prefix}${user_id}`, mod, "no");

                    }

                    return false;

                }

            }

        }

    } catch (error) {

        log.error(error, "security/authorize");

        throw error;

    }

};

const delete_cache = async token => {

    const user_id = await session.get(token, "user_id");

    cache.del(`${config.security.user_cache_prefix}${user_id}`);

    log.debug(`Cleared user cache, token ${utils.make_token_shorter(token)}, id ${user_id}`, "security/delete_cache");

};

module.exports = { password_hash, password_compare, user_is_admin, authorize, sanitize_path, delete_cache }
