"use strict";

const i18n = require("../app/i18n");

const path = require("path");
const fs = require("fs");
const comments = require("get-comments");

/**
sys_console/funs

This function return the functions defined on a module.

Arguments:
    [<string>module_name]

Example:
    ["sys_console"]

Returns:
    [...<string>function_name]

    On error returns the error message

*/
const funs = async (args, extras) => {
    const module_name = args;

    const module_path = path.join(__dirname, "/" + module_name + ".js");

    try {
        fs.accessSync(module_path, fs.R_OK);

        const action = require(module_path);

        return [false, Object.keys(action)];
    } catch (error) {
        return [true, null, "Error loading module [" + module_name + ": ]" + error.message];
    }
}

/**
sys_console/mods

This function return the modules defined on the server/frontend directory.

Arguments:
    None.

Example:
    None.

Returns:
    [...<string>module_name]

    On error returns the error message

*/
const mods = async (args, extras) => {
    const module_files = []

    const modules_path = path.join(__dirname);

    fs.readdirSync(modules_path).forEach((file) => {
        module_files.push(path.parse(file).name);
    });

    return [false, module_files];
}

/**
sys_console/coms

This function returns the comnents associated to a function declared inside a module.

Arguments:
    [<string>module_name, <string>function_name]

Example:
    ["sys_console", "funs"]

Returns:
    <string>comments or "NO_DATA_FOUND" when no comments defined

    On error returns the error message

*/
const coms = async (args, extras) => {
    /*
    Example of the data returned by get-comments
    [ { start: 587,
    end: 614,
    type: 'Block',
    loc: { start: [Object], end: [Object] },
    api: false,
    value: '*\r\n\tthis is a comment\r\n',
    after: 'const login = (args, callback, extras) => {' } ]
    */

    const mod = args[0];
    const fun = args[1];

    const module_path = path.join(__dirname, "/" + mod + ".js")

    try {
        fs.accessSync(module_path, fs.R_OK);

        const commdata = comments(fs.readFileSync(module_path, "utf8"), true);

        let response = "";

        if (commdata.length === 0) {
            return [true, null, await i18n.label(extras.token, "FUNCTION_DETAILS_NOT_FOUND")];
        } else {
            for (const comment of commdata) {
                if (comment.after && comment.after.indexOf(fun) !== -1) {
                    response = comment.value.replace("*\r\n", "");
                }
            }

            return [false, response];
        }
    } catch (error) {
        return [true, null, "Module file not found " + error.message];
    }
}

module.exports = { funs, mods, coms }
