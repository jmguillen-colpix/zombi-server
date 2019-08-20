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
// const sockets = require("../../src/sockets");

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
const getAll = async ({ companyId }) => {

    try {
        const sql = companyId 
            ? "select * from company_user where companyId = :id" 
            : "select * from company_user";
        const params = !companyId ? [] : [companyId];
        const { rows } = await db.sql(sql, params);

        return [false, rows];

    } catch(error) {

        return [true, null, error.message];

    }

};

const getById = async ({ id }) => {
    try {
        if (!id) return [true, null, 'Missing \'id\' arg'];
        const sql = "select * from company_user where id = " + id;
        const { rows } = await db.sql(sql);
        return [false, rows[0]];
    } catch(error) {
        return [true, null, error.message];
    }

};

const create = async ({ name, companyId }) => {
    try {
        if (!name || !companyId) return [true, null, 'Missing name or companyId arg'];
        const sql = `INSERT INTO company_user (name, companyId) VALUES (:name, :companyId)`;
        const data = await db.sql(sql, [name, companyId]);
        return [false, data];
    } catch (error) {
        return [true, null, error.message];
    }
};

const edit = async ({ name, id }) => {
    try {
        if (!name || !id) return [true, null, 'Missing name or id arg'];
        const sql = `UPDATE company_user SET name = :name WHERE id = :id`;
        const data = await db.sql(sql, [name, id]);
        return [false, data];
    } catch (error) {
        return [true, null, error.message];
    }
};

const remove = async ({ id }) => {
    try {
        if (!id) return [true, null, 'Missing id arg'];
        const sql = `DELETE FROM company_user WHERE id = :id`;
        const data = await db.sql(sql, [id]);
        return [false, data];
    } catch (error) {
        return [true, null, error.message];
    }
};

module.exports = { getAll, getById, create, edit, remove };
