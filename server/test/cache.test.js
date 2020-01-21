console.log = jest.fn();

const cache = require("../app/cache");

describe('Cache tests', () => {

    test("should get error before connect()", async done => {
        expect.assertions(1);

        try {
            await cache.keys("test");
        } catch (e) {
            expect(e.message).toBe("Cannot read property 'keys' of null");
        }

        await cache.connect();

        done();
    });

    test("get and set matches", async () => {
        await cache.set("test key", "test value");

        const value = await cache.get("test key");

        await expect(value).toBe("test value");
    });

    // Preparing for this
    // node_redis: Deprecated: The SET command contains a argument of type Object.
    // This is converted to "[object Object]" by using .toString() now and will return an error from v.3.0 on.
    // Please handle this in your code to make sure everything 
    // test("set throws error on invalid value", async () => {
    //     expect.assertions(1);
    //     try {
    //         await cache.set({key: "value"}, 99);
    //     } catch (e) {
    //         expect(e.message).toBe("Invalid values for key and/or value");
    //     }
    // });

    test("set throws error on empty values", async () => {
        expect.assertions(1);
        try {
            await cache.set();
        } catch (e) {
            expect(e.message).toBe("Invalid values for key and/or value");
        }
    });

    // Preparing for this    
    // node_redis: Deprecated: The GET command contains a "undefined" argument.
    // This is converted to a "undefined" string now and will return an error from v.3.0 on.
    // Please handle this in your code to make sure everything works as you intended it to.
    // test("get throws error on empty values", async () => {
    //     expect.assertions(1);
    //     try {
    //         await cache.get();
    //     } catch (e) {
    //         expect(e.message).toBe("Invalid values for key and/or value");
    //     }
    // });

    test("hget, hgetall and hmset matches", async () => {
        await cache.hmset("test set", { "test key1": "test value1", "test key2": "test value2" });

        const val = await cache.hget("test set", "test key2");
        const set = await cache.hgetall("test set");

        expect(val).toEqual("test value2");
        expect(set).toEqual({ "test key1": "test value1", "test key2": "test value2" });

        await cache.hset("test set", "test key3", "test value3");
        const val2 = await cache.hget("test set", "test key3");
        expect(val2).toEqual("test value3");
    });

    test("keys and delete operations", async () => {
        const keys = await cache.keys("test");

        expect(keys.length).toBeGreaterThan(0);

        const value = await cache.get("test key");

        await expect(value).toBe("test value");
        await cache.del("test key");
        await cache.del("test set");

        const del_val = await cache.get("test key");
        const del_set = await cache.hgetall("test key");

        await expect(del_val).toBeNull();
        await expect(del_set).toBeNull();
    });

    test("should get error after disconnect()", async done => {
        expect.assertions(1);

        try {
            await cache.disconnect();
            await cache.keys("test");
        } catch (e) {
            expect(e.message).toBe("AbortError: KEYS can't be processed. The connection is already closed.");
        }

        done();
    });

});
