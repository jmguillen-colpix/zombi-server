const config = require("../../config");
const log = require("../../log");
const stats = require("../../stats");

const { Client } = require("pg");


const clients = {};

const get_data_type = code => {
    /*

    https://github.com/brianc/node-postgres/issues/1688
    SELECT oid, typname, typcategory FROM pg_type WHERE typcategory in ('S', 'N', 'D') order by 3, 1;

    702     abstime         D
    1082 date         D
    1083 time         D
    1114 timestamp     D
    1184 timestamptz     D
    1266 timetz         D
    12403 time_stamp     D
    20     int8         N
    21     int2         N
    23     int4         N
    24     regproc         N
    26     oid             N
    700     float4         N
    701     float8       N
    790     money         N
    1700 numeric         N
    2202 regprocedure N
    2203 regoper         N
    2204 regoperator     N
    2205 regclass     N
    2206 regtype      N
    3734 regconfig      N
    3769 regdictionary N
    12396 cardinal_number N
    18     char         S
    19     name         S
    25     text         S
    194     pg_node_tree S
    1042 bpchar         S
    1043 varchar      S
    12398 character_data S
    12399 sql_identifier S
    12404 yes_or_no     S

    */

    if (
        code === 702 ||
        code === 1082 ||
        code === 1083 ||
        code === 1114 ||
        code === 1184 ||
        code === 1266 ||
        code === 12403
    ) {
        return "DATE";
    } else if (
        code === 20 ||
        code === 21 ||
        code === 23 ||
        code === 24 ||
        code === 26 ||
        code === 700 ||
        code === 701 ||
        code === 790 ||
        code === 1700 ||
        code === 2202 ||
        code === 2203 ||
        code === 2204 ||
        code === 2205 ||
        code === 2206 ||
        code === 3734 ||
        code === 3769 ||
        code === 12396
    ) {
        return "NUMERIC";
    } else {
        return "STRING";
    }
}

const connect = db_name => {
    try {
        if (typeof clients[db_name] === "undefined") {
            clients[db_name] = new Client({
                user: config.db[db_name].user,
                host: config.db[db_name].host,
                database: config.db[db_name].name,
                password: config.db[db_name].pass,
                port: config.db[db_name].port
            });
        }

        return clients[db_name].connect();
    } catch (error) { log(error.message, "postgresql/connect", true); }
}

const sql = (sql, bind, callback, db_name, options) => {

    const reply = { 
        info: { 
            db_name: db_name, 
            db_type: config.db[db_name].type, 
            rows: 0, 
            fields: [] 
        }, 
        rows: null 
    };

    let bind_count = 0;

    // This is to use Oracle's style bindvars, meaning colon prefixed words as bind variables on the SQL text
    // so this transforms a SQL text like "where id = :id" to "where id = $1"
    // Please note that PG uses double colon for casting, for example column::integer so we check for it
    const pgized_sql = sql.replace(/:\S*\w/g, x => {
        if (x.indexOf("::") === -1) { return "$" + (++bind_count); } else { return x; }
    });

    const query = {
        text: pgized_sql,
        values: bind,
        rowMode: "array"
    };

    clients[db_name].query(query)
        .then(res => {

            stats.dup();

            if (typeof callback === "function") {

                reply.info.rows = res.rowCount;

                if (res.command && res.command === "SELECT") {

                    res.fields.forEach(field => {
                        reply.info.fields.push({ name: field.name, type: get_data_type(field.dataTypeID) });
                    });

                    if(options.rows_as_objects) {

                        const object_rows = [];

                        res.rows.forEach(row => {

                            const object_row = {};

                            res.fields.forEach((field, index) => {

                                object_row[field.name] = row[index];

                            });

                            object_rows.push(object_row)

                        });

                        reply.rows = object_rows;


                    } else { reply.rows = res.rows; }

                }

                callback(null, reply);
            }
        })
        .catch((error) => {
            stats.rup();

            if (typeof callback === "function") { callback(error.message, false); }

            log(pgized_sql, "postgresql/sql", true);
            log(error, "postgresql/sql", true);
        });
}

const disconnect = db_name => { clients[db_name].end(); };

module.exports = { connect, disconnect, sql }
