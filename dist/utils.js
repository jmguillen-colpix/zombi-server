const timestamp = () => { return Math.floor(Date.now() / 1000); };
const is_empty = (thing) => {
    return (typeof thing === "undefined" ||
        thing === "" ||
        thing === null ||
        thing === "null" ||
        thing === "false" ||
        ( // Empty array
        is_array(thing) &&
            thing.length === 0) ||
        thing === 0 ||
        thing === "0" ||
        ( // Empty object
        typeof thing === "object" &&
            Object.keys(thing).length === 0 &&
            thing.constructor === Object));
};
const is_array = (thing) => {
    return thing instanceof Array || Object.prototype.toString.call(thing) === '[object Array]';
};
const is_object = (thing) => {
    return thing && typeof thing === 'object' && thing.constructor === Object;
};
const make_token_shorter = (token) => {
    if (!!token) {
        return token.substr(0, 10) + "..." + token.substr(-10);
    }
    else {
        return "none";
    }
};
module.exports = { timestamp, is_empty, is_array, is_object, make_token_shorter };
