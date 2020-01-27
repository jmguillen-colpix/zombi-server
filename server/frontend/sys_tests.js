"use strict";

const db = require("../app/db/db");
const session = require("../app/session");

const config = require("../app/config");

/**
sys_tests/ping

This function returns "pong" as data to test if the server is responding

Arguments:
    None

Example:
    None

Returns:
    <string>pong

    On error returns the error message

*/
const ping = async (args, extras) => { return { message: "pong" }; }

/**
sys_tests/echo

This function returns the parameters passed as is

Arguments:
    None

Example:
    None

Returns:
    The arguments without modification or processing

*/
const echo = async (args, extras) => { return { data: { args, extras } }; }

/**
sys_tests/db_sequence

This function execute the generic database sequence and returns the next value.

Arguments:
    None

Example:
    None

Returns:
    The next sequence value or error on error

*/
const db_sequence = async (args, extras) => { return { data: await db.sequence() }; };

/*

Joi.array().items() accepts another Joi schema to use against the array elements. So an array of strings is this easy:

Joi.array().items(Joi.string())
Same for an array of objects; just pass an object schema to items():

Joi.array().items(Joi.object({
    // Object schema
}))
*/
const test = async (args, extras) => {


    const x = Object.keys(config.db).filter(db => config.db[db].enabled);

    // const x = await db.sql({
    //     sql: "select * from tt6users",
    //     options: { rows_as_objects: true }
    // });

    return { data: x };

    // try {
    //     const x = await session.tokens(0);

    //     return [false, x];
    // } catch (error) {
    //     return [true, null, error.message];
    // }

    // send_message = (token, context = "none", data = [])
}

module.exports = { test, ping, echo, db_sequence }
