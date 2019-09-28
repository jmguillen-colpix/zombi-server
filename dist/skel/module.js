// const config   = require("../../src/config");
// const utils    = require('../../src/utils');
// const i18n     = require("../../src/i18n");
// const session  = require("../../src/session");
// const db       = require("../../src/db/db");
// const log      = require("../../src/log");
// const security = require("../../src/security");
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Uncomment the above requires as needed
/**
my_module/my_function

It is *very* important to comment each and every function.
The comments are shown on the Zombi Console and help the developer to know how to call the function.
Also helps to have an idea of what is returned so it is easier to handle the data client side
Please note that the arguments (and return data for case) show the type
of data (and scalar, an array like the exmple below, an object, etc) along with the type of
data of the elements prepended with colons to the element name

Arguments:
    [number:id, string:some_thing]

Returns:
    {"foo": "bar", "oof": "baz"}

    On error returns the error message

*/
const my_function = (args, extras) => __awaiter(this, void 0, void 0, function* () {
    try {
        const language = session.get(extras.token, "language");
        return [false, { i18n: i18n.get_lang_data(language) }];
    }
    catch (error) {
        return [true, null, error.message];
    }
});
module.exports = { my_function };
