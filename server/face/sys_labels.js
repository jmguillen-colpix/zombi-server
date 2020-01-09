const config   = require("../app/config");
const utils    = require("../app/utils");
const server   = require("../app/server");
const log      = require("../app/log");
const db       = require("../app/db/db");
const i18n     = require("../app/i18n");
const security = require("../app/security");
const datatables = require("../app/datatables");

const request = require("request-promise-native");

/**
sys_labels/labels_table_data

This function get Datatables data and returns the data to render the table on the client.
For reference see /src/datatables.js

Arguments:
    Datatables data object

Example:
    Datatables data return object

Returns:
    Error message when there is an error

*/
const labels_table_data = async (args, callback, extras) => {

    try {

        const sql = `select
                        id,
                        label_name,
                        label_lang_es,
                        label_lang_pt,
                        label_lang_en,
                        label_lang_fr,
                        label_lang_de,
                        label_lang_it,
                        label_lang_ko,
                        label_lang_ja,
                        label_lang_he,
                        label_lang_ru,
                        label_lang_zh,
                        details
                    from
                        ${db.table_prefix()}i18n_labels
                    where
                        lower(label_name) like '%' || lower(:search) || '%' or
                        lower(label_lang_es) like '%' || lower(:search) || '%' or
                        lower(label_lang_pt) like '%' || lower(:search) || '%' or
                        lower(label_lang_en) like '%' || lower(:search) || '%' or
                        lower(label_lang_fr) like '%' || lower(:search) || '%' or
                        lower(label_lang_de) like '%' || lower(:search) || '%' or
                        lower(label_lang_it) like '%' || lower(:search) || '%' or
                        lower(label_lang_ko) like '%' || lower(:search) || '%' or
                        lower(label_lang_ja) like '%' || lower(:search) || '%' or
                        lower(label_lang_he) like '%' || lower(:search) || '%' or
                        lower(label_lang_ru) like '%' || lower(:search) || '%' or
                        lower(label_lang_zh) like '%' || lower(:search) || '%'`;

        const data = await datatables.sql({sql: sql, data: args.data, download: args.download});

        return [false, data];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_labels/labels_add

This function creates a new label.
Only the name is mandatory but the english version is important because all others can be
automagically translated from it, see sys_labels/labels_translate

Arguments:
    [
        <string>label_name,
        <string>spanish,
        <string>portugese,
        <string>english,
        <string>french,
        <string>german,
        <string>italian,
        <string>korean,
        <string>japanese,
        <string>hebrew,
        <string>russian,
        <string>chinese
    ]

Example:
    ["RESPONSE", "Respuesta", "Resposta", "Response", "Réponse", "Antwort", "Risposta", "응답", "対応", "תגובה", "Ответ", "响应"]
]

Returns:
    Error message when there is an error

*/
const labels_add = async (args, extras) => {

    try {

        if(!Array.isArray(args) || typeof args[0] === "undefined") { throw Error(i18n.label(extras.token, "WRONG_PARAMETERS")); }

        const name = args[0];
        const es   = args[1];
        const pt   = args[2];
        const en   = args[3];
        const fr   = args[4];
        const de   = args[5];
        const it   = args[6];
        const ko   = args[7];
        const ja   = args[8];
        const he   = args[9];
        const ru   = args[10];
        const zh   = args[11];
        const details = args[12];


        const sql = `insert into ${db.table_prefix()}i18n_labels (
                        ID,
                        DETAILS,
                        LABEL_NAME,
                        LABEL_LANG_ES,
                        LABEL_LANG_PT,
                        LABEL_LANG_EN,
                        LABEL_LANG_FR,
                        LABEL_LANG_DE,
                        LABEL_LANG_IT,
                        LABEL_LANG_KO,
                        LABEL_LANG_JA,
                        LABEL_LANG_HE,
                        LABEL_LANG_RU,
                        LABEL_LANG_ZH
                    )
                    values (
                        :id,
                        :details,
                        :label_name,
                        :label_lang_es,
                        :label_lang_pt,
                        :label_lang_en,
                        :label_lang_fr,
                        :label_lang_de,
                        :label_lang_it,
                        :label_lang_ko,
                        :label_lang_ja,
                        :label_lang_he,
                        :label_lang_ru,
                        :label_lang_zh
                    )`;

        const seq = await db.sequence();

        const reply = await db.sql(
            sql, 
            [seq, details, name, es, pt, en, fr, de, it, ko, ja, he, ru, zh]
        );

        return [false, reply.info.rows];

    } catch(error) {

        return [true, false, error.message];

    }

};

/**
sys_labels/labels_edit_data

This function obtains the information about a label passed by id to populate the edit screen on the client.

Arguments:
    [<integer>id]

Example:
    [3411]
]

Returns:
    An array representing the result of the query:
        select LABEL_NAME, LABEL_LANG_ES, LABEL_LANG_PT, LABEL_LANG_EN, LABEL_LANG_FR, LABEL_LANG_DE, LABEL_LANG_IT, LABEL_LANG_KO, LABEL_LANG_JA, LABEL_LANG_HE, LABEL_LANG_RU, LABEL_LANG_ZH from zombi_i18n_labels where id = :id
    or the error message on error

*/
const labels_edit_data = async (args, extras) => {

    try {

        const id = parseInt(args[0]);

        const sql = `select LABEL_NAME, LABEL_LANG_ES, LABEL_LANG_PT, LABEL_LANG_EN, LABEL_LANG_FR, LABEL_LANG_DE, LABEL_LANG_IT, LABEL_LANG_KO, LABEL_LANG_JA, LABEL_LANG_HE, LABEL_LANG_RU, LABEL_LANG_ZH, DETAILS from ${db.table_prefix()}i18n_labels where id = :id`;
    
        const reply = await db.sql(sql, [id]);

        return [false, reply.rows];

    } catch(error) {

        return [true, null, error.message];

    }

}

/**
sys_labels/labels_edit

This function modifies the label with the data provided as arguments.

Arguments:
    [
        <integer>id,
        <string>label_name,
        <string>spanish,
        <string>portugese,
        <string>english,
        <string>french,
        <string>german,
        <string>italian,
        <string>korean,
        <string>japanese,
        <string>hebrew,
        <string>russian,
        <string>chinese
    ]

Example:
    [3411, "RESPONSE", "Respuesta", "Resposta", "Response", "Réponse", "Antwort", "Risposta", "응답", "対応", "תגובה", "Ответ", "响应"]
]

Returns:
    Error message when there is an error

*/
const labels_edit = async (args, extras) => {

    try {

        const id   = args[0];
        const name = args[1];
        const es   = args[2];
        const pt   = args[3];
        const en   = args[4];
        const fr   = args[5];
        const de   = args[6];
        const it   = args[7];
        const ko   = args[8];
        const ja   = args[9];
        const he   = args[10];
        const ru   = args[11];
        const zh   = args[12];
        const details = args[13];

        const sql = `
            update ${db.table_prefix()}i18n_labels
            set
                label_name = :label_name,
                label_lang_es = :label_lang_es,
                label_lang_pt = :label_lang_pt,
                label_lang_en = :label_lang_en,
                label_lang_fr = :label_lang_fr,
                label_lang_de = :label_lang_de,
                label_lang_it = :label_lang_it,
                label_lang_ko = :label_lang_ko,
                label_lang_ja = :label_lang_ja,
                label_lang_he = :label_lang_he,
                label_lang_ru = :label_lang_ru,
                label_lang_zh = :label_lang_zh,
                details = :details
            where id = :id`;

        const reply = await db.sql(sql, [name, es, pt, en, fr, de, it, ko, ja, he, ru, zh, details, id]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

}

/**
sys_labels/labels_delete

This function deletes the label passed by id.

Arguments:
    <integer>id

Example:
    3411


Returns:
    The number of rows deleted on success or the error message on error

*/
const labels_delete = async (args, extras) => {

    try {

        const id = args[0];

        const reply = await db.sql(`delete from ${db.table_prefix()}i18n_labels where id = :id`, [id]);

        return [false, reply.info.rows];

    } catch(error) {

        return [true, null, error.message];

    }

}

/**
sys_labels/labels_translate

This function connects to a web service and translates (from english) any label without a value.

Arguments:
    None

Example:
    None

Returns:
    An array with the labels translated or the error message on error

*/
const labels_translate = async (args, extras) => {

    try {

        const langs = ["es", "pt", "fr", "de", "it", "ko", "ja", "ru", "zh", "he"];

        var lang_values = {};

        var messages = [];

        const sql = `select
                        label_name,
                        label_lang_es,
                        label_lang_pt,
                        label_lang_en,
                        label_lang_fr,
                        label_lang_de,
                        label_lang_it,
                        label_lang_ko,
                        label_lang_ja,
                        label_lang_he,
                        label_lang_ru,
                        label_lang_zh,
                        id
                    from
                        ${db.table_prefix()}i18n_labels
                    where label_lang_en is not null
                    order by 1`;

        const reply = await db.sql(sql);

        for (const row of reply.rows) {

            lang_values.name = row[0];
            lang_values.es = row[1];
            lang_values.pt = row[2];
            lang_values.en = row[3];
            lang_values.fr = row[4];
            lang_values.de = row[5];
            lang_values.it = row[6];
            lang_values.ko = row[7];
            lang_values.ja = row[8];
            lang_values.he = row[9];
            lang_values.ru = row[10];
            lang_values.zh = row[11];
            lang_values.row_id = row[12];

            if(utils.is_empty(lang_values.en)) {

                log("Text english value is empty, cannot translate", "sys_labels/labels_translate");

            } else {

                const url = "https://translate.yandex.net/api/v1.5/tr.json/translate";

                for (const lang of langs) {
                    try {
                        
                        if(utils.is_empty(lang_values[lang])) {

                            var translate_what = lang_values.en, 
                                translate_to = lang, 
                                translate_row_id = lang_values.row_id;
    
                            const body = await request.post({
                                url: url, 
                                form: {
                                    "key": "trnsl.1.1.20160402T182226Z.626056fb4ea475b0.e4b4668fb20600cd4d3a9eea485898c48f423639",
                                    "text": translate_what,
                                    "lang": "en-" + translate_to
                                }
                            });

                            var http_body = JSON.parse(body);
                    
                            if(http_body.text && Array.isArray(http_body.text)) {
    
                                var label = http_body.text[0];
    
                                log("Translating [" + lang + "] " + translate_what + " to " + label, "sys_labels/labels_translate");
    
                                await db.sql(
                                    `update ${db.table_prefix()}i18n_labels set label_lang_${lang} = :label where id = :id`,
                                    [label, translate_row_id]
                                );

                                messages.push(`Translated ${translate_what} to ${label}`);
    
                            } else { messages.push(`Label not found: ${label}`); }
    
                        }

                    } catch (error) { messages.push(`Label not found: ${label}`); }

                }

            }

        }

        if(messages.length === 0) {

            return [true, "No labels to translate"];

        } else {

            return [false, null, messages];

        }

    } catch(error) {

        return [true, null, error.message];

    }

}

module.exports = { labels_add, labels_edit_data, labels_edit, labels_delete, labels_translate, labels_table_data }