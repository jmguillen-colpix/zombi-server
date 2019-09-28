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
const db = require("../db/db");
const create = (prefix = null) => __awaiter(this, void 0, void 0, function* () {
    try {
        const locked = config.schema.locked;
        if (locked) {
            throw new Error("Schema is locked, check config file");
        }
        else {
            const table_prefix = (prefix === null) ? config.schema.table_prefix : prefix;
            let schema;
            const db_type = config.db["default"].type;
            switch (db_type) {
                case "postgresql":
                    schema = require("../db/schema/postgresql");
                    break;
                case "oracle":
                    schema = require("../db/schema/oracle");
                    break;
                case "mysql":
                    schema = require("../db/schema/mysql");
                    break;
                default: throw new Error("Wrong DB Type, check config file");
            }
            yield db.connect("default");
            const commands = schema.create_schema(table_prefix);
            for (const command of commands) {
                yield db.sql(command);
            }
            yield db.shutdown("default");
        }
    }
    catch (error) {
        log(error.message, "schema/create", true);
        yield db.shutdown("default");
    }
});
module.exports = { create };
