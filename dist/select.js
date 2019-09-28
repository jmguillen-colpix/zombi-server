var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// const config = require("../src/config");
// const utils = require('../src/utils');
// const server = require("../src/server");
const db = require("./db/db");
const select = (data) => __awaiter(this, void 0, void 0, function* () {
    const results = [];
    var sql = "select " + data.id + ", " + data.text + " from " + data.table;
    const order = (data.order) ? data.order : "1";
    if (data.filter) {
        sql += " where ";
        if (Array.isArray(data.filter) && Array.isArray(data.filter[0])) {
            for (const f of data.filter) {
                if (Array.isArray(f)) {
                    sql += f[0] + " = '" + f[1] + "' and ";
                }
            }
            sql = sql.substring(0, sql.length - 5);
        }
        else {
            sql += data.filter[0] + " = '" + data.filter[1] + "'";
        }
    }
    sql += " order by " + order;
    const reply = yield db.sql(sql);
    for (const s of reply.rows) {
        results.push([s[0], s[1]]);
    }
    return results;
});
module.exports = { select };
