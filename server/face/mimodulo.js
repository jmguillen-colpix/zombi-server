const config   = require("../../src/config");
// const utils    = require('../../src/utils');
// const server   = require("../../src/server");
// const i18n    = require("../../src/i18n");
// const cache   = require("../../src/cache");
const log      = require("../../src/log");
const db       = require("../../src/db/db");
// const stats    = require("../../src/stats");
// const session = require("../../src/session");
// const datatables = require("../../src/datatables");
const client = require("../../src/client");

const util = require('util');

/**
mimodulo/test

This function is a test blah blah

Arguments:
    The number of lines to return, defaults to 100

Example:
    20

Returns:
    Error message when there is an error

*/
const test = async (args, extras) => {

    try {

        // throw new Error("WFT1");

        // throw "swwwfwefwefwef";

        
        const data = await client.exec("tserver", ["mimodulo", "test2", 999]);

        // const data = await db.sql("tserver", ["mimodulo", "test2", 999]);

        // console.log(data);

        // if(data.error) { throw new Error(data.message); }

        return [data.error, data];

    } catch(error) {

        console.log("exeption");

        return [true, null, error.message];

    }

};

const test2 = async (args, extras) => {

    try {

        return [false, args + 1];

    } catch(error) {

        return [true, null, error.message];

    }

};

module.exports = { test, test2 }