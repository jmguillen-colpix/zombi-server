// const config = require("../src/config");
// const utils = require('../src/utils');
// const server = require("../src/server");
const db = require("./db/db");

const select = async data => {

    const results = [];

    var sql = "select " + data.id + ", " + data.text + " from " + data.table;

    const order = (data.order) ? data.order : "1"; 

    if(data.filter) {

        sql += " where ";

        if(Array.isArray(data.filter) && Array.isArray(data.filter[0])) {

            for (const f of data.filter) {

                if(Array.isArray(f)) {

                    sql += f[0] + " = '" + f[1] + "' and ";

                }

            }

            sql = sql.substring(0, sql.length - 5);

        } else {

            sql += data.filter[0] + " = '" + data.filter[1] + "'";

        }

    }

    sql += " order by " + order;

    const reply = await db.sql(sql);

    for (const s of reply.rows) {

        results.push([s[0], s[1]]);

    }

    return results;


};

module.exports = { select };

