const config = require("../config");
const log    = require("../log");
const db     = require("../db/db");

const create = async (prefix = null) => {

    try {

        const locked = config.schema.locked;

        if(locked) {

            throw new Error("Schema is locked, check config file");
    
        } else {

            const table_prefix = (prefix === null) ? config.schema.table_prefix : prefix ;

            let schema;
        
            const db_type = config.db["default"].type;
        
            switch(db_type) {
        
                case "postgresql": schema = require("../db/schema/postgresql"); break;
        
                case "oracle": schema = require("../db/schema/oracle"); break;
        
                case "mysql": schema = require("../db/schema/mysql"); break;
        
                default: throw new Error("Wrong DB Type, check config file");
            
            }
        
            await db.connect("default");
        
            const commands = schema.create_schema(table_prefix);

            for (const command of commands) {

                await db.sql(command);
                
            }
        
            await db.shutdown("default");

        }
        
    } catch (error) {

        log(error.message, "schema/create", true);

        await db.shutdown("default");
        
    }

};

module.exports = { create }

