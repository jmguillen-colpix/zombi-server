const config = require("../config");
const log = require("../log");

var db = {};

const connect = async (database = null) => {

    const databases = Object.keys(config.db);

    let dbs = "";

    for (const db_name of databases) {

        if (db_name === database || database === null) {

            dbs += `${db_name}(${config.db[db_name].type}) `

        }

    }

    log.info(`Connecting to databases ${dbs}`, "db/connect");

    for (const db_name of databases) {

        if ((db_name === database || database === null) && config.db[db_name].enabled === true) {
            
            const db_type = config.db[db_name].type;

            switch (db_type) {

                case "postgresql": db[db_name] = require("./abstraction/postgresql"); break;

                case "oracle": db[db_name] = require("./abstraction/oracle"); break;

                case "mysql": db[db_name] = require("./abstraction/mysql"); break;

                default: throw new Error("Wrong DB Type, check config file");

            }

            await db[db_name].connect(db_name);

            log.info(`Connected to db ${db_name} ${db_type}@${config.db[db_name].host}:${config.db[db_name].port}/${config.db[db_name].name}`, `db/${db_name}/connect`);
        
        }

    }

}

const disconnect = async (database = null) => {

    const databases = Object.keys(config.db);

    for (const db_name of databases) {

        if (
            (db_name === database || database === null) &&
            config.db[db_name].enabled === true &&
            db[db_name]
        ) {

            await db[db_name].disconnect(db_name);

            log.info(`Disconnected from db ${db_name}`, "db/disconnect");
        }

    }

}

const shutdown = (database = null) => {

    const databases = Object.keys(db);

    for (const db_name of databases) {

        if (db_name === database || database === null) {

            db[db_name].shutdown(db_name);

        }
    }

}

const _sql = ({ sql, bind = [], db_name = "default", options = {} }) => {

    return new Promise((resolve, reject) => {

        if(!sql) { throw new Error("Empty SQL query"); }

        db[db_name].sql(
            sql,
            bind,
            (err, res) => {
                if (err) { reject(new Error(err)); } 
                else { resolve(res); }
            },
            db_name,
            options
        );

    });

}

const sqlv = async ({ sql, bind = [], db_name = "default" }) => {

    const data = await _sql({ sql, bind, db_name });

    return data.rows[0][0];

}

const sequence = async (db_name = "default") => {

    try {

        let res = null;

        const db_type = config.db[db_name].type;

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
                res = await _sql({ sql: "select nextval('zombi_seq')::integer" });

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

                res = await _sql({ sql: "select zombi_seq.nextval from dual" });

                break;

            case "mysql":
                /*
                This may work on MariaDB 10.3: https://mariadb.com/kb/en/library/create-sequence/
                Also it may be possible to implement what is shown here: https://www.convert-in.com/docs/mysql/sequence.htm
                */
                res = await _sql({ sql: "select nextval('zombi_sequence')" });

                break;

            default: throw new Error("Wrong DB Type, check config file");

        }

        return res.rows[0][0];

    } catch (error) { log.error(error, "db/sequence"); }
}

const table_prefix = () => { return config.schema.table_prefix; }

module.exports = {
    sql: _sql,
    sqlv,
    sequence,
    connect,
    disconnect,
    shutdown,
    table_prefix
}
