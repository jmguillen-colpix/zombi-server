const config   = require("../app/config");
// const server   = require("../app/server");
// const i18n    = require("../app/i18n");
// const cache   = require("../app/cache");
const log      = require("../app/log");
// const db       = require("../app/db/db");
// const stats    = require("../app/stats");
// const session = require("../app/session");
// const datatables = require("../app/datatables");
// const sockets = require("../app/sockets");


/**
sys_admin/get_server_log

This function returns the last lines of the server log file

Arguments:
    The number of lines to return, defaults to 100

Example:
    20

Returns:
    Error message when there is an error

*/
const get_server_log = async (args, extras) => {

    try {

        // const lines = (!Object.keys(args).length) ? 100 : parseInt(args) ;

        // const exec = util.promisify(require("child_process").exec);

        // const { stdout, stderr } = await exec(`tail -${lines} storage/logs/${config.server.log.file_name} | sort -r`);

        // return [false, stdout + stderr];

        return [false, "Not implemented"];

    } catch(error) {

        return [true, null, error.message];

    }

};

const db_create_schema = async (args, extras) => {

    try {

        const schema = require("../app/db/schema");

        await schema.create();

        return [false];

    } catch(error) {

        log(error.message, "sys_admins/db_create_schema", true);

        return [true, null, error.message];

    }

};

module.exports = { get_server_log, db_create_schema }
