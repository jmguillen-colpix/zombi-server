const config   = require("../app/config");
// const utils    = require("../../app/utils");
// const server   = require("../app/server");
// const i18n    = require("../app/i18n");
// const cache   = require("../app/cache");
// const log      = require("../app/log");
const db       = require("../app/db/db");
// const stats    = require("../app/stats");
// const session = require("../app/session");
// const datatables = require("../app/datatables");
// const sockets = require("../app/sockets");

// const util = require("util");

/**
sys_sql/query

This function executes an SQL sentence

Arguments:
    If arguments is an array the first element is the SQL sentence 
    and the second the database defined on config.js
    If the arguments is an scalar it is the SQL sentence to be executed
    on the default database.

Example:
    ["select * from dual", "ora_db"]

Returns:
    Error message when there is an error

*/
const query = async (args, extras) => {

    try {

        if (Array.isArray(args)) {

            var params = [];

            if (args.length === 3) {

                params = args ;

            } else if (args.length === 2) {

                params = [args[0], args[1], "default"];
                
            } else if (args.length === 1) {

                params = [args[0], [], "default"];
                
            } else {

                return [true, "Wrong number of arguments, should be: <sql, [bind], [db_name]>"];

            }

        } else {

            params = [args, [], "default"];

        }

        reply = await db.sql(params[0], params[1], params[2]);

        return [false, reply];

    } catch(error) {

        return [true, null, error.message];

    }

};

module.exports = { query }
