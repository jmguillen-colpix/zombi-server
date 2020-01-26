const config = require("./config");
const log = require("./log");
const db = require("./db/db");
const session = require("./session");
const cache = require("./cache");

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
            
            console.log(`User with token ${token} is admin`);
            return true; // You are already God, say no more
        } else {
            const user_id = await session.get(token, "user_id");

            const authorized = await cache.maybe(`USER_AUTH:${user_id}:${mod}`, async () => {

                const sql = `select count(*) from (select *
                from
                    ${db.table_prefix()}users zou
                        join ${db.table_prefix()}groups_to_users zog on (zou.id = zog.user_id)
                        join ${db.table_prefix()}groups_to_modules zom on (zog.group_id = zom.group_id)
                where 1=1
                    and zou.id = :user_id
                    and zom.module_name = :module_name) inq`;

                const reply = parseInt(await db.sqlv({ sql, bind: [user_id, mod] }));

                const authorized = reply > 0 ? "yes" : "no";

                return authorized;

            });

            return authorized === "yes";

        }
    } catch (error) {
        log(error, "security/authorize", true);

        throw error;
    }
};

module.exports = { password_hash, password_compare, user_is_admin, authorize, sanitize_path }
