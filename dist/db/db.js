var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config = require("../config");
const log = require("../log");
var db = {};
const connect = (database = null) => __awaiter(this, void 0, void 0, function* () {
    const databases = Object.keys(config.db);
    let dbs = "";
    for (const db_name of databases) {
        if (db_name === database || database === null) {
            dbs += `${db_name}(${config.db[db_name].type}) `;
        }
    }
    log(`Connecting to databases ${dbs}`, "db/connect");
    for (const db_name of databases) {
        if ((db_name === database || database === null) && config.db[db_name].enabled === true) {
            let db_type = config.db[db_name].type;
            switch (db_type) {
                case "postgresql":
                    db[db_name] = require("./abstraction/postgresql");
                    break;
                case "oracle":
                    db[db_name] = require("./abstraction/oracle");
                    break;
                case "mysql":
                    db[db_name] = require("./abstraction/mysql");
                    break;
                default: throw new Error("Wrong DB Type, check config file");
            }
            yield db[db_name].connect(db_name);
            log("Connected to " + db_name + " postgresql@" + config.db[db_name].host + ":" + config.db[db_name].port + "/" + config.db[db_name].name, `db/${db_name}/connect`);
        }
    }
});
const shutdown = (database = null) => {
    const databases = Object.keys(db);
    for (const db_name of databases) {
        if (db_name === database || database === null) {
            db[db_name].shutdown(db_name);
        }
    }
};
const sql_cb = (sql, bind = [], callback = null, db_name = "default") => {
    db[db_name].sql(sql, bind, callback, db_name);
};
const sql = (sql, bind = [], db_name = "default") => {
    return new Promise((resolve, reject) => {
        db[db_name].sql(sql, bind, (err, res) => {
            if (err) {
                reject(new Error(err));
            }
            else {
                resolve(res);
            }
        }, db_name);
    });
};
const sequence = () => __awaiter(this, void 0, void 0, function* () {
    try {
        let res = null;
        const db_type = config.db["default"].type;
        switch (db_type) {
            case "postgresql":
                // CREATE SEQUENCE IF NOT EXISTS zombi_seq START 1;
                /*
                create or replace FUNCTION zombi_sequence
                RETURN integer
                IS
                    l_seq_value integer;
                BEGIN
                    SELECT zombi_seq.nextval into l_seq_value from dual;
                    RETURN l_seq_value;
                END zombi_sequence;
                */
                res = yield sql("select nextval('zombi_seq')::integer");
                break;
            case "oracle":
                // CREATE SEQUENCE zombi_seq INCREMENT BY 1 START WITH 1;
                /*
                CREATE OR REPLACE FUNCTION zombi_sequence()
                RETURNS integer AS
                $func$
                BEGIN
    
                RETURN (SELECT nextval('zombi_seq'));
    
                END
                $func$  LANGUAGE plpgsql;
                */
                res = yield sql("select zombi_seq.nextval from dual");
                break;
            case "mysql":
                /*
                This may work on MariaDB 10.3: https://mariadb.com/kb/en/library/create-sequence/
                Also it may be possible to implement what is shown here: https://www.convert-in.com/docs/mysql/sequence.htm
                */
                throw ("Sequence not implemented for MySQL");
            // break;
            default: throw ("Wrong DB Type, check config file");
        }
        return res.rows[0][0];
    }
    catch (error) {
        log(error.message, "db/sequence", true);
    }
});
const flat = arr => [].concat(...arr);
const table_prefix = () => { return config.schema.table_prefix; };
const metadata = (object_name, object_type = "table", db_name = "default") => __awaiter(this, void 0, void 0, function* () {
    const db_type = config.db[db_name].type;
    let data = [];
    switch (db_type) {
        case "postgresql":
            switch (object_type) {
                case "table":
                    data = yield sql(`SELECT columns.table_name,
                            columns.column_name,
                            columns.data_type,
                            columns.column_default,
                            columns.is_nullable
                        FROM information_schema.columns
                        where table_name = :object_name`, [object_name]);
                    break;
            }
            break;
        case "oracle": break;
        case "mysql": break;
        default: throw new Error("Wrong DB Type, check config file");
    }
    return data;
});
module.exports = { metadata, sql_cb, sql, sequence, connect, shutdown, flat, table_prefix };
