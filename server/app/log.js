"use strict";

const config = require("./config");

const chalk = require("chalk");

const log = (message, context = "UNKNOWN", error = false) => {
    if (
        (config.server.log.log_info && !error) ||
        (config.server.log.log_error && error)
    ) {
        const t = (new Date()).toISOString();

        let msg;

        if (message.stack && typeof message.stack === "string") { // https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            msg = message.stack;
            error = true;
        } else {
            msg = message;
        }

        if (typeof msg !== "string") { msg = "Incorrect message type for logging"; }

        const m = t + " [" + context + "] " + msg;

        const badge = (error) ? chalk.red("ERROR ") : chalk.green("INFO  ");

        process._rawDebug(badge + m);

        return true;
    }
};

module.exports = log;
