"use strict";

const config = require("./config");

const chalk = require("chalk");

const error_levels = {
    "FATAL": 0,
    "ERROR": 1,
    "WARN": 2,
    "INFO": 3,
    "DEBUG": 4,
    "TRACE": 5,
};

const _log = (message, context = "UNKNOWN", level) => {

    if (error_levels[config.server.log.log_level] >= level || level === null) {

        const t = (new Date()).toISOString();

        let msg;

        if (message.stack && typeof message.stack === "string") { // https://stackoverflow.com/questions/30469261/checking-for-typeof-error-in-js
            msg = message.stack;
        } else {
            msg = message;
        }

        if (typeof msg !== "string") { msg = "Incorrect message type for logging"; }

        const m = t + " [" + context + "] " + msg;

        let badge;

        switch (level) {
            case 0: badge = chalk.red("FATAL "); break;
            case 1: badge = chalk.red("ERROR "); break;
            case 2: badge = chalk.yellow("WARN  "); break;
            case 3: badge = chalk.green("INFO  "); break;
            case 4: badge = chalk.green("DEBUG "); break;
            case 5: badge = chalk.blue("TRACE "); break;
            default: badge = chalk.blue("NONE  "); break;
        }
        
        process._rawDebug(badge + m);

        return true;
    }
};

const always = (message, context) => { _log(message, context, null); }
const fatal = (message, context) => { _log(message, context, 0); }
const error = (message, context) => { _log(message, context, 1); }
const warn = (message, context) => { _log(message, context, 2); }
const info = (message, context) => { _log(message, context, 3); }
const debug = (message, context) => { _log(message, context, 4); }
const trace = (message, context) => { _log(message, context, 5); }

module.exports = {
    fatal,
    error,
    warn,
    info,
    debug,
    trace,
    always
};
