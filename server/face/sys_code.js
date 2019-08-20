// const config   = require("../../src/config");
// const utils    = require('../../src/utils');

const fs   = require("fs");
const util = require("util");
const path = require("path");

/**
sys_code/mod_fun_list

This function returns the list of modules/functions defined

Arguments:
    None

Example:
    None

Returns:
    Error message when there is an error

*/
const mod_fun_list = async (args, extras) => {

    try {

        let modfuns = {};

        const modules_path = path.join(__dirname);

        const rd = util.promisify(fs.readdir);

        const files = await rd(modules_path);

        files.forEach(file => {

            const module_path = path.join(__dirname, file);

            const action = require(module_path);

            modfuns[path.parse(file).name] = Object.keys(action);

        });

        return [false, modfuns];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_code/modules_list

This function returns the list of modules defined

Arguments:
    None

Example:
    None

Returns:
    Error message when there is an error

*/
const modules_list = async (args, extras) => {

    try {

        let modules = [];

        const modules_path = path.join(__dirname);

        const rd = util.promisify(fs.readdir);

        const files = await rd(modules_path);

        files.forEach(file => {

            modules.push(path.parse(file).name);

        });

        return [false, modules];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_code/code_list

This function returns the list of modules/functions defined

Arguments:
    None

Example:
    None

Returns:
    Error message when there is an error

*/
const module_code = async (args, extras) => {

    try {

        const mod = args;

        const module_path = path.join(__dirname, mod + ".js");

        const rf = util.promisify(fs.readFile);

        const file = await rf(module_path, 'utf8');

        return [false, file];

    } catch(error) {

        return [true, null, error.message];

    }

};

module.exports = { modules_list, module_code, mod_fun_list }
