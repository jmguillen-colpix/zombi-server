const config   = require("../../src/config");
// const utils    = require('../../src/utils');
// const server   = require("../../src/server");
// const i18n    = require("../../src/i18n");
// const cache   = require("../../src/cache");
const log      = require("../../src/log");
// const db       = require("../../src/db/db");
// const stats    = require("../../src/stats");
// const session = require("../../src/session");
// const datatables = require("../../src/datatables");
// const sockets = require("../../src/sockets");

const util = require('util');

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

        const lines = (!Object.keys(args).length) ? 100 : parseInt(args) ;

        const exec = util.promisify(require('child_process').exec);

        const { stdout, stderr } = await exec(`tail -${lines} storage/logs/${config.server.log.file_name} | sort -r`);

        return [false, stdout + stderr];

    } catch(error) {

        return [true, null, error.message];

    }

};

const db_create_schema = async (args, extras) => {

    try {

        const schema = require("../../src/db/schema");

        await schema.create();

        return [false];

    } catch(error) {

        log(error.message, "sys_admins/db_create_schema", true);

        return [true, null, error.message];

    }

};

module.exports = { get_server_log, db_create_schema }
