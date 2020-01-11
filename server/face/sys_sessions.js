"use strict";

const config = require("../app/config");
const db = require("../app/db/db");
const session = require("../app/session");
const sockets = require("../app/sockets");
// const datatables = require("../app/datatables");
const cache = require("../app/cache");

/**
sys_sessions/sessions_table_data

This function get Datatables data and returns the data to render the table on the client.
For reference see /src/datatables.js

Arguments:
    Datatables data object

Example:
    Datatables data return object

Returns:
    Error message when there is an error

*/
const sessions_table_data = async (args, extras) => {

    try {

        const sessions = [];

        const session_key = config.session.cache_prefix;

        const cache_keys = await cache.keys(session_key);

        for (const cache_key of cache_keys) {

            const session_data = await cache.hgetall(cache_key);

            const user_name = await db.sqlv(`select full_name from ${db.table_prefix()}users where id = :id`, [session_data.user_id])

            sessions.push({...session_data, user_name});

        }

        return [false, sessions];

    } catch (error) {

        return [true, null, error.message];

    }

};

/**
sys_sessions/session_delete

This function deletes a session

Arguments:
    <string>session token

Example:
    "3AC24F45D2...0F3EA776A491B92F7"

Returns:
    Error message when there is an error or the number of affected rows on success

*/
const session_delete = async (args, extras) => {

    try {

        const token = args;

        await session.destroy(token);

        return [false];

    } catch (error) {

        return [true, null, error.message];

    }

};

/**
sys_sessions/send_message_to_session

This function sends a message to the session with the token passed as argument

Arguments:
    [<string>session token, <string>message]

Example:
    ["3AC24F45D2...0F3EA776A491B92F7", "Hello!"]

Returns:
    Error message when there is an error

*/
const send_message_to_session = async (args, extras) => {

    try {

        const token = args[0];
        const message = args[1];

        sockets.send_message_to_session(token, "SESSIONS_SEND_MESSAGE", message);

        return [false];

    } catch (error) {

        return [true, null, error.message];

    }

}

/**
sys_sessions/send_message_to_user

This function sends a message to the session with the token passed as argument

Arguments:
    [<string>session token, <string>message]

Example:
    ["3AC24F45D2...0F3EA776A491B92F7", "Hello!"]

Returns:
    Error message when there is an error

*/
const send_message_to_user = async (args, extras) => {

    try {

        const user_id = args[0];
        const message = args[1];

        sockets.send_message_to_session(token, "SESSIONS_SEND_MESSAGE", message);

        return [false];

    } catch (error) {

        return [true, null, error.message];

    }

}

module.exports = { session_delete, sessions_table_data, send_message_to_session }
