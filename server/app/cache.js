const config = require("./config");
const log = require("./log");

let redis = null;

const connect = () => {
    
    redis = require("redis").createClient({ host: config.cache.host, port: config.cache.port });

    redis.auth(config.cache.pass, () => {});

    redis.on("error", (err) => { log.error("Redis error: " + err, "cache/connect"); });
    
    redis.on("connect", () => {
        log.info("Connected to Redis server at " + config.cache.host + ":" + config.cache.port, "cache/connect");
    });

};


// redis.keys("*", function (err, replies) { });
const keys = (key) => {
    return new Promise((resolve, reject) => {
        redis.keys(key + "*", (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
};

// redis.hset("hash key", "hashtest 1", "some value", redis.print);
const hset = (set, key, value) => {
    return new Promise((resolve, reject) => {
        redis.hset(set, key, value, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
}

// redis.hmset("key", { "0123456789": "abcdefghij",  "some manner of key": "a type of value" });
const hmset = (set, values) => {
    return new Promise((resolve, reject) => {
        redis.hmset(set, values, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
}

// redis.hget( "foo", "hello", function(err, result) { });
const hget = (set, key) => {
    return new Promise((resolve, reject) => {
        redis.hget(set, key, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
}

// client.hgetall("key", function (err, obj) { });
const hgetall = (set) => {
    return new Promise((resolve, reject) => {
        redis.hgetall(set, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
}

const set = (key, value) => {
    return new Promise((resolve, reject) => {
        if (!key || !value) { reject(new Error("Invalid values for key and/or value")); }
        else {
            redis.set([key, JSON.stringify(value)], (err, reply) => {
                if (err) { reject(new Error(err)); } else { resolve(reply); }
            });
        }
    });
};

const get = key => {
    return new Promise((resolve, reject) => {
        redis.get(key, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(JSON.parse(reply)); }
        });
    });
};

const del = key => {
    return new Promise((resolve, reject) => {
        redis.del(key, (err, reply) => {
            if (err) { reject(new Error(err)); } else { resolve(reply); }
        });
    });
};

const disconnect = () => { if(redis) { redis.quit(); }};

module.exports = { connect, set, get, del, hset, hget, hgetall, hmset, keys, disconnect };
