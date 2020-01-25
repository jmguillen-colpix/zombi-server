const config = require("../app/config");
const i18n = require("../app/i18n");
const session = require("../app/session");
const db = require("../app/db/db");
const log = require("../app/log");
const security = require("../app/security");

/**
sys_login/start

If the user is already logged in to the application he does not need to send user/pass again but to "start" the application.
That means reusing the saven token on the client to authenticate and loading the i18n data to the client.

Arguments:
    None

Returns:
    {i18n}

    On error returns the error message

*/
const start = async (args, extras) => {

    const language = await session.get(extras.token, "language");

    return { data: { i18n: i18n.get_lang_data(language) } };

};

/**
sys_login/login

This function is used to login to the application.
It is important for the client to save the token returned and use it to authenticate on subsequent requests.

Arguments:
    [<string>username, <string>password, <string>language]

Example:
    ["mary", "PaSsw0rd", "es"]

Returns:
    {fullname, token, timezone, i18n}

    On error returns the code 1004 to be translated on the frontend

*/
const login = async (args, extras) => {

    const username = args[0] ? args[0] : "";
    const password = args[1] ? args[1] : "";
    const language = args[2] ? args[2] : config.i18n.lang;

    const i18n_data = i18n.get_lang_data(language);

    if(!i18n_data) {

        return {
            error: true,
            code: 1005,
            message: "Invalid language"
        };

    }

    const userlower = username.toLowerCase();

    const sql = `select 
                    zou.username,
                    zou.password,
                    zou.full_name,
                    zou.id,
                    zzo.zone_name,
                    zou.is_admin
                from
                    ${db.table_prefix()}users zou
                        left join ${db.table_prefix()}tz_zones zzo on (zou.timezone_id = zzo.zone_id)
                        left join ${db.table_prefix()}i18n_languages zla on (zou.language_id = zla.id)
                        left join ${db.table_prefix()}tz_countries zco on (zou.country_id = zco.id)
                where lower(username) = :username`;

    const res = await db.sql(sql, [userlower]);

    if (res.rows.length === 0) {

        log(`User [${username}] not found`, "sys_login/login");

        return {
            error: true,
            code: 1004,
            message: "Cannot login"
        };

    } else {

        const encrpass = res.rows[0][1];
        const full_name = res.rows[0][2];
        const user_id = res.rows[0][3];
        const timezone = (res.rows[0][4] === null) ? config.i18n.timezone : res.rows[0][4];
        const is_admin = (res.rows[0][5] === "Y");

        if (await security.password_compare(password, encrpass)) {

            const token = session.token();

            await session.create(token, user_id, language, timezone, full_name, is_admin);

            return {
                data: { fullname: full_name, token: token, timezone: timezone, i18n: i18n_data }
            };

        } else {

            log(`User [${username}] cannot login`, "sys_login/login");

            return {
                error: true,
                code: 1004,
                message: "Cannot login"
            };

        }

    }

};

/**
sys_login/logoff

This function destroys the session.

Arguments:
    No arguments, just uses the token from the call

Returns:
    Nothing useful: {error: false}
*/
const logoff = async (args, extras) => {

    await session.destroy(extras.token);

    return { error: false };
    
};

module.exports = { login, start, logoff }
