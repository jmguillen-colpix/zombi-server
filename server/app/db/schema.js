const config = require("../config");
const log = require("../log");
const db = require("../db/db");

(async () => {

    if (config.schema.locked) {

        log("Schema is locked, check config file");

    } else {

        const table_prefix = process.env.ZOMBI_DB_TABLE_PREFIX || config.schema.table_prefix;

        log(`Using schema prefix "${table_prefix}"`, "schema/create");

        let schema;

        const db_type = config.db.default.type;

        switch (db_type) {

            case "postgresql": schema = require("../db/schema/postgresql"); break;

            case "oracle": schema = require("../db/schema/oracle"); break;

            case "mysql": schema = require("../db/schema/mysql"); break;

            default: throw new Error("Wrong DB Type, check config file");
            
        }

        await db.connect("default");

        const commands = schema.create_schema(table_prefix);

        for (const sql of commands) {

            try {

                await db.sql({sql});

            } catch (error) {

                log(error, "schema/create", true);

                process.exit(1);

            }

        }

    }

    process.exit(0);

})();
