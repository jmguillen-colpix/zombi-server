const config = require("./config");
const log    = require('./log');
// const server = require("./server");
// const i18n   = require("./i18n");

const redis = require("redis").createClient({ host: config.cache.host, port: config.cache.port });

redis.on("error", (err) => { log("Redis error: " + err, "cache/main", true); });

redis.on("connect", () => {

    log("Connected to Redis server at " + config.cache.host + ":" + config.cache.port, "cache/main");

});

const keys = (key) => {

    return new Promise((resolve, reject) => {

        redis.keys(key + "*", (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

};

const hset = (set, key, value) => {

    return new Promise((resolve, reject) => {

        redis.hset(set, key, value, (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

}

const hmset = (set, values) => {

    return new Promise((resolve, reject) => {

        redis.hmset(set, values, (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

}

const hget = (set, key) => {

    return new Promise((resolve, reject) => {

        redis.hget(set, key, (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

}

const hgetall = (set) => {

    return new Promise((resolve, reject) => {

        redis.hgetall(set, (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

}



//client.hmset("key", ["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});

const set = (key, value) => {

    return new Promise((resolve, reject) => {

        redis.set([key, JSON.stringify(value)], (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

};

const get = key => {

    return new Promise((resolve, reject) => {

        redis.get(key, (err, reply) => {

            console.log(reply);
            
            if(err) { reject(new Error(err)); } 
            else { resolve(JSON.parse(reply)); }
    
        });

    });

};

const del = key => {

    return new Promise((resolve, reject) => {

        redis.del(key, (err, reply) => {
            
            if(err) { reject(new Error(err)); } 
            else { resolve(reply); }
    
        });

    });

};

module.exports = { set, get, del, hset, hget, hgetall, hmset, keys };

