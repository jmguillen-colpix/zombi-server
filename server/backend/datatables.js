"use strict";

const config = require("../app/config");
const log = require("../app/log");
const db = require("../app/db/db");

/*

Example of data sent by the client

{

    "draw": 1,
    "columns": [{
        "data": 0,
        "name": "employee_name",
        "searchable": true,
        "orderable": true,
        "search": {
            "value": "",
            "regex": false
        }
    }, {
        "data": 1,
        "name": "department",
        "searchable": true,
        "orderable": true,
        "search": {
            "value": "",
            "regex": false
        }
    }],
    "order": [{
        "column": 0,
        "dir": "asc"
    }],
    "start": 0,
    "length": 10,
    "search": {
        "value": "",
        "regex": false
    }

}

Example of response

const response = {
    "draw": extras.sequence,
    "recordsTotal": 57,
    "recordsFiltered": 57,
    "data": [
        [
        "Airi",
        "Satou",
        "Accountant",
        "Tokyo",
        "28th Nov 08",
        "$162,700"
        ],
        [
        "Angelica",
        "Ramos",
        "Chief Executive Officer (CEO)",
        "London",
        "9th Oct 09",
        "$1,200,000"
        ]
    ]
};

*/

const sql = async (args) => {

    const db_type = config.db.default.type;

    const data = args.data;

    const raw_sql = args.sql;

    let bind_count = 0;

    const bind = [];

    let sql;

    switch (db_type) {

        case "postgresql":
            sql = raw_sql.replace(/:search/g, () => { bind.push(data.search.value); return "$" + (++bind_count); });
            break;

        case "mysql":
            sql = raw_sql.replace(/:search/g, () => { bind.push(data.search.value); (++bind_count); return "?"; });
            break;

        case "oracle":
            // TODO implement
            break;

        default:
            log.error("Database setup error", "datatables/sql");
            throw new Error(`Database setup error: ${__filename}`);

    }

    const paging = [...bind];

    if (args.download) {

        sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc");

        const rows = [];

        const resp = await db.sql({
            sql,
            bind
        });

        for (const s of resp.rows) { rows.push(s); }

        resolve(rows);

    } else {

        let count;

        switch (db_type) {

            case "postgresql":
                count = "select count(*) from (" + sql + ") inq";
                break;

            case "mysql":
                count = "select count(*) from (" + sql + ") inq";
                break;

            case "oracle":
                count = "select count(*) from (" + sql + ") inq";
                break;

            default:
                log.error("Database setup error", "datatables/sql");
                throw new Error(`Database setup error: ${__filename}`);

        }

        sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc");

        switch (db_type) {

            case "postgresql":
                sql += " limit $" + (++bind_count) + " offset $" + (++bind_count);
                paging.push(data.length)
                paging.push(data.start);
                break;

            case "mysql":
                sql += " limit ? offset ?";
                ++bind_count;
                ++bind_count;
                paging.push(data.length)
                paging.push(data.start);
                break;

            case "oracle":

                sql = `select sq.*
                            from
                            (
                                select inq.*, rownum as rn
                                from (" + sql + ") inq
                                where rownum <= :limit
                            ) sq
                            where sq.rn > :offset`;
                paging.push(data.start + data.length)
                paging.push(data.start);
                break;
        }

        var response = {
            draw: 0,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
        };

        const count_results = await db.sql({ sql: count, bind });

        response.recordsFiltered = count_results.rows[0][0];

        response.recordsTotal = count_results.rows[0][0];

        const paging_results = await db.sql({ sql, bind: paging });

        for (const s of paging_results.rows) { response.data.push(s); }

        return response;

    }

};

module.exports = { sql }
