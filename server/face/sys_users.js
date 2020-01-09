const config   = require("../app/config");
const utils    = require("../app/utils");
const server   = require("../app/server");
const i18n     = require("../app/i18n");
const log      = require("../app/log");
const db       = require("../app/db/db");
const select   = require("../app/select");
const security = require("../app/security");
const sockets  = require("../app/sockets");

const datatables = require("../app/datatables");

/**
sys_users/users_languages_select

This function get data to populate a select como on the client
Users table {table: "zombi_i18n_languages", id: "id", text: "language_name"};

Arguments:
    None

Example:
    None

Returns:
    Error message when there is an error

*/
const users_languages_select = async (args, extras) => {

    try {

        const dbo = {table: `${db.table_prefix()}i18n_languages`, id: "id", text: "language_name", order: "2"};

        const res = await select.select(dbo);
        
        return [false, res];

    } catch (error) {

        return [true, null, error.message];
        
    }

    

};

/**
sys_users/users_countries_select

This function get data to populate a select como on the client
Users table {table: "zombi_tz_countries", id: "id", text: "country_name"};

Arguments:
    None

Example:
    None

Returns:
    Error message when there is an error

*/
const users_countries_select = async (args, extras) => {

    try {

        const dbo = {table: `${db.table_prefix()}tz_countries`, id: "id", text: "country_name", order: "2"};

        const res = await select.select(dbo);
        
        return [false, res];

    } catch (error) {

        return [true, null, error.message];
        
    }

};

/**
sys_users/users_timezones_select

This function get data to populate a select como on the client
Users table {table: "zombi_tz_countries", id: "id", text: "country_name"};

Arguments:
    [<string>filter column id, <string>filter column value]    

Example:
    ["country_id", 99]    

Returns:
    Error message when there is an error

*/
const users_timezones_select = async (args, extras) => {

    try {

        const filter = args;

        const dbo = {table: `${db.table_prefix()}tz_zones`, id: "zone_id", text: "zone_name", filter: filter, order: "2"};

        const res = await select.select(dbo);
        
        return [false, res];

    } catch (error) {

        return [true, null, error.message];
        
    }

};

/**
sys_users/users_table_data

This function get Datatables data and returns the data to render the table on the client.
For reference see /src/datatables.js

Arguments:
    Datatables data object

Example:
    Datatables data return object

Returns:
    Error message when there is an error

*/
const users_table_data = async (args, extras) => {

    try {

        const sql = `select 
                    zou.id,
                    zou.id,
                    zou.username,
                    zou.full_name,
                    zou.is_admin,
                    zou.email,
                    zla.language_name,
                    zco.country_name,
                    zzo.zone_name,
                    zou.created_date
                from
                    ${db.table_prefix()}users zou
                        left join ${db.table_prefix()}tz_zones zzo on (zou.timezone_id = zzo.zone_id)
                        left join ${db.table_prefix()}i18n_languages zla on (zou.language_id = zla.id)
                        left join ${db.table_prefix()}tz_countries zco on (zou.country_id = zco.id)
                where
                    lower(zou.username) like '%' || lower(:search) || '%' or
                    lower(zou.full_name) like '%' || lower(:search) || '%' or
                    lower(zou.email) like '%' || lower(:search) || '%' or
                    lower(zla.language_name) like '%' || lower(:search) || '%' or
                    lower(zco.country_name) like '%' || lower(:search) || '%' or
                    lower(zzo.zone_name) like '%' || lower(:search) || '%'`;

        const data = await datatables.sql({sql: sql, data: args.data, download: args.download});

        return [false, data];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_users/users_add

This function add a user to the system.

Arguments:
    [
        <string>username, 
        <string>full name, 
        <string>password, 
        <string>email, 
        <integer>language, 
        <integer>country, 
        <integer>timezone, 
        <string>is admin
    ]

Example:
    ["johnny", "John Long", "PaSsw0rd", "jlong@mail.com", 1, 235, 380, "Y"]

Returns:
    An array with the labels translated or the error message on error

*/
const users_add = async (args, extras) => {

    try {

        const username = args[0];
        const fullname = args[1];
        const password = args[2];
        const email    = args[3];
        const language = args[4];
        const country  = args[5];
        const timezone = args[6];
        const is_admin = args[7];

        const sql = `insert into ${db.table_prefix()}users (
                        id, 
                        username, 
                        full_name, 
                        password, 
                        email, 
                        language_id, 
                        country_id, 
                        timezone_id, 
                        created_date, 
                        is_admin, 
                        enabled
                    ) 
                    values (
                        :id, 
                        :username, 
                        :full_name, 
                        :password, 
                        :email, 
                        :lang_code, 
                        :country_code, 
                        :timezone, 
                        :created_date, 
                        :is_admin, 
                        :enabled
                    )`;

        const seq = await db.sequence();
        
        const hash = security.password_hash(password);

        const reply = await db.sql(
            sql, 
            [seq, username, fullname, hash, email, language, country, timezone, utils.timestamp(), is_admin, "Y"]
        );

        return [false, reply];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_users/users_edit_data

This function obtains the information about a user passed by id to populate the edit screen on the client.

Arguments:
    id

Example:
    3114

Returns:
    An error message on error or an array with the data with the form:

        [
        <string>username,
        <string>full_name,
        <string>email,
        <integer>timezone_id,
        <integer>language_id,
        <integer>country_id,
        <string>password,
        <string>is_admin
        ]

*/
const users_edit_data = async (args, extras) => {

    try {

        const user_id = parseInt(args);

        const sql = `select 
                        zou.username,
                        zou.full_name,
                        zou.email,
                        zou.timezone_id,
                        zou.language_id,
                        zou.country_id,
                        zou.password,
                        zou.is_admin
                    from
                    ${db.table_prefix()}users zou
                            left join ${db.table_prefix()}tz_zones zzo on (zou.timezone_id = zzo.zone_id)
                            left join ${db.table_prefix()}i18n_languages zla on (zou.language_id = zla.id)
                            left join ${db.table_prefix()}tz_countries zco on (zou.country_id = zco.id)
                    where zou.id = :id`;

        const reply = await db.sql(sql, [user_id]);

        return [false, reply.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_users/users_edit

This function modifies the user with the data provided as arguments.
If the password is omited (sent empty) is does not change the password stored on the db,
otherwise it is hashed and stored the same way that when creating a new user

Arguments:
    [
        <string>username, 
        <string>full name, 
        <string>password, 
        <string>email, 
        <integer>language, 
        <integer>country, 
        <integer>timezone, 
        <string>is admin,
        <integer>id
    ]

Example:
    ["johnny", "John Long", "PaSsw0rd", "jlong@mail.com", 1, 235, 380, "Y", 3114]

Returns:
    Error message when there is an error or the number of affected rows on success

*/
const users_edit = async (args, extras) => {

    try {

        const id       = args[0];
        const username = args[1];
        const fullname = args[2];
        const password = args[3];
        const email    = args[4];
        const language = args[5];
        const country  = args[6];
        const timezone = args[7];
        const is_admin = args[8];

        if(password === "") {

            const sql = `update ${db.table_prefix()}users
                        set
                            username = :username,
                            full_name = :full_name,
                            email = :email,
                            language_id = :language_id,
                            country_id = :country_id, 
                            timezone_id = :timezone_id,
                            is_admin = :is_admin
                        where id = :id`;

            const reply = await db.sql(sql, [username, fullname, email, language, country, timezone, is_admin, id]);

            return [false, reply.info.rows];

        } else {

            const sql = `update ${db.table_prefix()}users
                        set
                            username = :username,
                            full_name = :full_name,
                            password = :password, 
                            email = :email,
                            language_id = :language_id,
                            country_id = :country_id, 
                            timezone_id = :timezone_id,
                            is_admin = :is_admin
                        where id = :id`;

            const hash = security.password_hash(password);

            const reply = await db.sql(sql, [username, fullname, hash, email, language, country, timezone, is_admin, id]);

            return [false, reply.info.rows];

        }

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_users/users_delete

This function deletes the user passed by id.

Arguments:
    <integer>id

Example:
    3411

Returns:
    The number of rows deleted on success or the error message on error

*/
const users_delete = async (args, extras) => {

    try {

        const id = parseInt(args);

        if(id === 0) { return [true, i18n.label(extras.token, "USER_SYSTEM_CANNOT_BE_DELETED")]; }

        else {

            const sql = `delete from ${db.table_prefix()}users where id = :id`;

            const reply = await db.sql(sql, [id]);

            return [false, reply.info.rows];

        }

    } catch(error) {

        return [true, null, error.message];

    }

};


/**
sys_users/users_toggle_admin

This function changes the field "is_admin" on the database from 'Y' to 'N' and vice versa.

Arguments:
    <integer>id

Example:
    3411

Returns:
    The number of rows deleted on success or the error message on error

*/
const users_toggle_admin = async (args, extras) => {

    try {

        const id = args;

        const sql = `update ${db.table_prefix()}users set is_admin = case when is_admin = 'Y' then 'N' else 'Y' end where id = :id`;

        const reply = await db.sql(sql, [id]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};


/**
sys_users/send_message_to_user

This function send a message to all the sessions a user, passed by id, have created

Arguments:
    [<integer>user id, <string> message]

Example:
    [3411, "Hey!"]

Returns:
    Error message on error

*/
const send_message_to_user = async (args, extras) => {

    try {

        const user_id = args[0];
        const message = args[1];

        await sockets.send_message_to_user(user_id, "SESSIONS_SEND_MESSAGE", message);

        return [false];

    } catch(error) {

        return [true, null, error.message];

    }

};

module.exports = {
    users_languages_select,
    users_countries_select,
    users_timezones_select,
    users_table_data,
    users_add,
    users_edit,
    users_edit_data,
    users_delete,
    users_toggle_admin,
    send_message_to_user
}

