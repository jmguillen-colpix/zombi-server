// const config  = require("./config");
// const server  = require("./server");
const session = require("./session");
const log     = require("./log");


const db = require("./db/db");

let i18n_data = {
    es: {},
    pt: {},
    en: {},
    fr: {},
    de: {},
    it: {},
    ko: {},
    ja: {},
    he: {},
    ru: {},
    zh: {}
};

const get_lang_data = (lang) => { return i18n_data[lang]; };

const label = async (token, label) => {

    const language = await session.get(token, "language");

    if(token && i18n_data[language] && i18n_data[language][label]) { return i18n_data[language][label]; }
    else { return "[" + label + "]"}

};

const load_labels = async () => {

    try {

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
                    label_lang_zh
                from
                    ${db.table_prefix()}i18n_labels
                order by 1`;

        const reply = await db.sql(sql);

        const rows = reply.rows;

        log(rows.length + " i18n labels loaded", "load_labels");

        for (const row of rows) {

            let label_name = row[0].toUpperCase();

            i18n_data["es"][label_name] = row[1];
            i18n_data["pt"][label_name] = row[2];
            i18n_data["en"][label_name] = row[3];
            i18n_data["fr"][label_name] = row[4];
            i18n_data["de"][label_name] = row[5];
            i18n_data["it"][label_name] = row[6];
            i18n_data["ko"][label_name] = row[7];
            i18n_data["ja"][label_name] = row[8];
            i18n_data["he"][label_name] = row[9];
            i18n_data["ru"][label_name] = row[10];
            i18n_data["zh"][label_name] = row[11];
            
        }
        
    } catch (error) {

        log(error.message, "load_labels", true);
        
    }

};

module.exports = { load_labels, label, get_lang_data }