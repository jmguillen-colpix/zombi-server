const config = require("./config");
const log    = require('./log');
// const server = require("./server");
// const i18n   = require("./i18n");

const redis = require("redis").createClient({
    host: config.cache.host, port: config.cache.port
});

redis.on("error", (err) => { log("Redis error: " + err, "cache/main", true); });

redis.on("connect", () => {
    log("Connected to Redis server at " + config.cache.host + ":" + config.cache.port, "cache/main");
});

const set = (key, value, callback) => {

    try {

        redis.set([key, JSON.stringify(value)], (err, reply) => {
                
            if(err) { if(typeof callback === "function") { callback(err, false); } } 
            else { if(typeof callback === "function") { callback(null, reply); } }
    
        });

    } catch (error) {

        if(typeof callback === "function") { callback(error.message, false); }

    }

};

const get = (key, callback) => {

    try {

        redis.get(key, (err, reply) => {
            
            if(err) { if(typeof callback === "function") { callback(err, false); } } 
            else { if(typeof callback === "function") { callback(null, JSON.parse(reply)); } }
    
        });

    } catch (error) {

        if(typeof callback === "function") { callback(error.message, false); }

    }

};

const del = (key, callback) => {

    try {

        redis.del(key, (err, reply) => {
            
            if(err) { if(typeof callback === "function") { callback(err, false); } } 
            else { if(typeof callback === "function") { callback(null, reply); } }
    
        });

    } catch (error) {

        if(typeof callback === "function") { callback(error.message, false); }

    }

};

module.exports = { set, get, del };

