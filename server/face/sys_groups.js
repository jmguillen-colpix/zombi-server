const config   = require("../../src/config");
const utils    = require('../../src/utils');
const server   = require("../../src/server");
const i18n    = require("../../src/i18n");
// const cache   = require("../../src/cache");
const log      = require("../../src/log");
const db       = require("../../src/db/db");
const session  = require("../../src/session");
const security = require("../../src/security");
const datatables = require("../../src/datatables");

const path = require("path");
const fs = require("fs");

/**
sys_groups/groups_table_data

This function get Datatables data and returns the data to render the table on the client.
For reference see /src/datatables.js

Arguments:
    Datatables data object

Example:
    Datatables data return object

Returns:
    Error message when there is an error

*/
const groups_table_data = async (args, extras) => {

    try {

        const sql = `select
                    zog.id,
                    zog.group_name,
                    zog.description,
                    zog.id,
                    zog.id,
                    zou.full_name,
                    zog.created_ts
                from ${db.table_prefix()}groups zog
                    left join ${db.table_prefix()}users zou on (zog.created_by = zou.id)
                where
                    lower(zog.group_name) like '%' || lower(:search) || '%' or
                    lower(zou.full_name) like '%' || lower(:search)`;

        const data = await datatables.sql({sql: sql, data: args.data, download: args.download});

        return [false, data];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_add

This function add a group to the system.

Arguments:
    [
        <string>group name, 
        <string>description
    ]

Example:
    ["Accounting Users", "This is the group for the accounting module users"]

Returns:
    An array with the labels translated or the error message on error

*/
const groups_add = async (args, extras) => {

    try {

        const groupname   = args[0];
        const description = args[1];

        const sql = `insert into ${db.table_prefix()}groups (
                        id, 
                        group_name, 
                        description, 
                        created_by, 
                        created_ts 
                    ) 
                    values (
                        :id, 
                        :group_name, 
                        :description, 
                        :created_by, 
                        :created_ts 
                    )`;

        const seq = await db.sequence();
        
        const reply = await db.sql(
            sql, 
            [seq, groupname, description, session.get(extras.token, "user_id"), utils.timestamp()]
        );

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_edit_data

This function obtains the information about a group passed by id to populate the edit screen on the client.

Arguments:
    id

Example:
    3114

Returns:
    An error message on error or an array with the data with the form:

        [
        <string>group_name,
        <string>description,
        <integer>id
        ]

*/
const groups_edit_data = async (args, extras) => {

    try {

        const user_id = parseInt(args[0]);

        const sql = `select 
                        group_name, description, id
                    from
                        ${db.table_prefix()}groups
                    where id = :id`;

        const reply = await db.sql(
            sql, 
            [user_id]
        );

        return [false, reply.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_edit

This function modifies the group with the data provided as arguments.

Arguments:
    [
        <string>group_name,
        <string>description,
        <integer>id
    ]

Example:
    ["New Accounting Group", "This groups if for accounting managers", 3114]

Returns:
    Error message when there is an error or the number of affected rows on success

*/
const groups_edit = async (args, extras) => {

    try {

        const group_name  = args[0];
        const description = args[1];
        const id          = args[2];

        const sql = `update ${db.table_prefix()}groups
                        set
                            group_name = :group_name,
                            description = :description
                        where id = :id`;

        const reply = await db.sql(
            sql, 
            [group_name, description, id]
        );

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_delete

This function deletes the group passed by id.

Arguments:
    <integer>id

Example:
    3411

Returns:
    The number of rows deleted on success or the error message on error

*/
const groups_delete = async (args, extras) => {

    try {

        const id = args;

        const sql = `delete from ${db.table_prefix()}groups where id = :id`;

        const reply = await db.sql(
            sql, 
            [id]
        );

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};


/**
sys_groups/groups_add_user_to_group

This function adds a user to a group, both send by id (check zombi_users and zombi_groups) 
and inserts them on the aggrupation table zombi_groups_to_users

Arguments:
    [<integer>group id, <integer>user id]

Example:
    [3411, 16723]

Returns:
    The affected rows on success or the error message on error

*/

const groups_add_user_to_group = async (args, extras) => {

    try {

        const group_id = args[0];
        const user_id  = args[1];

        let sql = `delete from ${db.table_prefix()}groups_to_users where group_id = :group_id and user_id = :user_id`;

        await db.sql(sql, [group_id, user_id]);

        sql = `insert into ${db.table_prefix()}groups_to_users (id, group_id, user_id) values (${await db.sequence()}, :group_id, :user_id)`;

        const reply = await db.sql(sql, [group_id, user_id]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_remove_user_from_group

This function removes a user from a group.

Arguments:
    [<integer>group id, <integer>user id]

Example:
    [3411, 16723]

Returns:
    The affected rows on success or the error message on error

*/
const groups_remove_user_from_group = async (args, extras) => {

    try {

        const group_id = args[0];
        const user_id  = args[1];

        const sql = `delete from ${db.table_prefix()}groups_to_users where group_id = :group_id and user_id = :user_id`;

        const reply = await db.sql(sql, [group_id, user_id]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};


/**
sys_groups/groups_users_shift_to_group

This function gets a group id as argument and returns 2 arrays, 
one with the user ids not on that group and one with the complement, 
meaning the user ids of users belonging to that group.

Arguments:
    <integer>group id

Example:
    3411

Returns:
    The arrays of user ids, like

    [
        [...<integer>user ids not in group],
        [...<integer>user ids in group],
    ]

*/
const groups_users_shift_to_group = async (args, extras) => {

    const id = args;

    const sql1 = `select id, full_name from ${db.table_prefix()}users where id not in (select user_id from ${db.table_prefix()}groups_to_users where group_id = :id) order by 2`;

    const users_not_in = await db.sql(sql1, [id]);

    const sql2 = `select id, full_name from ${db.table_prefix()}users where id in (select user_id from ${db.table_prefix()}groups_to_users where group_id = :id) order by 2`;

    const users_in = await db.sql(sql2, [id]);

    return [false, [users_not_in.rows, users_in.rows]];

};

/**
sys_groups/groups_add_module_to_group

This function adds a module to a group so the users on that group have execute access to the module

Arguments:
    [<integer>group id, <string>module name]

Example:
    [3411, "sys_console"]

Returns:
    The affected rows on success or the error message on error

*/

const groups_add_module_to_group = async (args, extras) => {

    try {

        const group_id    = args[0];
        const module_name = args[1];

        let sql = `delete from ${db.table_prefix()}groups_to_modules where group_id = :group_id and module_name = :module_name`;

        await db.sql(sql, [group_id, module_name]);
        
        sql = `insert into ${db.table_prefix()}groups_to_modules (id, group_id, module_name) values (${await db.sequence()}, :group_id, :module_name)`;

        const reply = await db.sql(sql, [group_id, module_name]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_modules_shift_to_group

This function gets a group id as argument and returns 2 arrays, 
one with the modules not on that group and one with the complement, 
meaning the modules belonging to that group.

Arguments:
    <integer>group id

Example:
    3411

Returns:
    The arrays of user ids, like

    [
        [...<string>modules not in group],
        [...<string>modules in group],
    ]

*/
const groups_modules_shift_to_group = async (args, extras) => {

    try {

        const group_id = parseInt(args);

        let module_files = []

        const modules_path = path.join(__dirname);

        fs.readdirSync(modules_path).forEach(file => {

            module_files.push(path.parse(file).name);

        });

        const sql = `select module_name from ${db.table_prefix()}groups_to_modules where group_id = :id order by 1`;

        const reply = await db.sql(sql, [group_id]);
        
        const included = reply.rows;

        const elements = [];

        for (const iterator of included) {

            elements.push(iterator[0]);
            
        }

        let intersection = module_files.filter(x => elements.includes(x));

        let difference = module_files.filter(x => !elements.includes(x));

        return [false, [difference, intersection]];
    
    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_groups/groups_remove_module_from_group

This function removes a module from a group.

Arguments:
    [<integer>group id, <string>module name]

Example:
    [3411, "sys_console"]

Returns:
    The affected rows on success or the error message on error

*/
const groups_remove_module_from_group = async (args, extras) => {

    try {

        const group_id    = args[0];
        const module_name = args[1];

        const sql = `delete from ${db.table_prefix()}groups_to_modules where group_id = :group_id and module_name = :module_name`;

        const reply = await db.sql(sql, [group_id, module_name]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

module.exports = {
    groups_table_data,
    groups_add,
    groups_edit,
    groups_edit_data,
    groups_delete,
    groups_users_shift_to_group,
    groups_add_user_to_group,
    groups_remove_user_from_group,
    groups_add_module_to_group,
    groups_modules_shift_to_group,
    groups_remove_module_from_group
}
