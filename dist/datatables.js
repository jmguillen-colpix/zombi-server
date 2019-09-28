var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config = require("../src/config");
const log = require('../src/log');
// const server = require("../src/server");
const db = require("./db/db");
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
const sql = (args, callback) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        try {
            const db_type = config.db["default"].type;
            const data = args.data;
            let raw_sql = args.sql;
            let bind_count = 0;
            const bind = [];
            let sql = raw_sql.replace(/:search/g, () => { bind.push(data.search.value); return "$" + (++bind_count); });
            const paging = [...bind];
            if (args.download) {
                sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc");
                let rows = [];
                db.sql(sql, bind, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        for (const s of res.rows) {
                            rows.push(s);
                        }
                        resolve(rows);
                    }
                });
            }
            else {
                let count;
                switch (db_type) {
                    case "postgresql":
                        count = "select count(*) from (" + sql + ") inq";
                        break;
                    case "oracle":
                        count = "select count(*) from (" + sql + ") inq";
                        break;
                    default:
                        log("Database setup error", "datatables/sql", true);
                        callback("Database setup error", false);
                        return;
                }
                sql += " order by " + (data.order[0].column + 1) + ((data.order[0].dir === "asc") ? " asc" : " desc");
                switch (db_type) {
                    case "postgresql":
                        sql += " limit $" + (++bind_count) + " offset $" + (++bind_count);
                        paging.push(data.length);
                        paging.push(data.start);
                        break;
                    case "oracle":
                        sql = "select sq.* \
                                from \
                                ( \
                                    select inq.*, rownum as rn  \
                                    from (" + sql + ") inq \
                                    where rownum <= :limit \
                                ) sq \
                                where sq.rn > :offset";
                        paging.push(data.start + data.length);
                        paging.push(data.start);
                        break;
                }
                var response = {
                    "draw": 0,
                    "recordsTotal": 0,
                    "recordsFiltered": 0,
                    "data": []
                };
                db.sql_cb(count, bind, (err, res) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        response.recordsFiltered = res.rows[0][0];
                        response.recordsTotal = res.rows[0][0];
                        db.sql_cb(sql, paging, (err, res) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                for (const s of res.rows) {
                                    response.data.push(s);
                                }
                                resolve(response);
                            }
                        });
                    }
                });
            }
        }
        catch (error) {
            reject(error.message);
        }
    });
});
module.exports = { sql };
