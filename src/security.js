const config = require("./config");
// const utils  = require("./utils");
const log    = require("./log");
const db     = require("./db/db");
const session = require('./session');

const bcrypt = require('bcryptjs');
const path = require('path');
const url = require('url');

const sanitize_path = url_path => {

    // https://en.wikipedia.org/wiki/Directory_traversal_attack
    return path.normalize(url.parse(url_path).pathname).replace(/^(\.\.[\/\\])+/, '');

}
        
const password_hash = password => {

    return bcrypt.hashSync(password, config.security.salt_rounds);

}

const password_compare = (password, hash) => {

    return bcrypt.compareSync(password, hash);
    
}

const user_is_admin = (token) => {

    // TODO Ok, does this belong to session? Maybe not.
    // TODO A better alternative might be something that is obtained (an cached) from the user data
    return session.get(token, "is_admin");

}

const authorize = async (token, mod) => {

    try {

        if(user_is_admin(token)) { return true; } // You are already God, say no more
    
        else {

            const user_id = await session.get(token, "user_id");

            // TODO this should be cached on Redis to improve performance and avoid the extra DB call on every request
            const sql = `select count(*) from (select *
                        from
                            ${db.table_prefix()}users zou
                                join ${db.table_prefix()}groups_to_users zog on (zou.id = zog.user_id)
                                join ${db.table_prefix()}groups_to_modules zom on (zog.group_id = zom.group_id)
                        where 1=1
                            and zou.id = :user_id
                            and zom.module_name = :module_name) inq`;

            const reply = await db.sql(sql, [user_id, mod]);

            const count = parseInt(reply.rows[0][0]);

            return (count > 0);

        }
        
    } catch (error) {

        log("Authorization error: " + error.message, "security/authorize", true);

        throw new Error("YOU_ARE_NOT_AUTHORIZED");
        
    }

};

module.exports = { password_hash, password_compare, user_is_admin, authorize, sanitize_path }

