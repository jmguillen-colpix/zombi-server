console.log = jest.fn();

const cache = require("../app/cache");

test("get and set matches", async () => {
    await cache.set("test key", "test value");

    const value = await cache.get("test key");

    await expect(value).toBe("test value");
});

test("hget, hgetall and hmset matches", async () => {
    await cache.hmset("test set", { "test key1": "test value1", "test key2": "test value2" });

    const val = await cache.hget("test set", "test key2");
    const set = await cache.hgetall("test set");

    expect(val).toEqual("test value2");
    expect(set).toEqual({ "test key1": "test value1", "test key2": "test value2" });
});

test("keys and delete operations", async () => {
    const keys = await cache.keys("test");

    expect(keys.length).toBeGreaterThan(0);

    const value = await cache.get("test key");

    await expect(value).toBe("test value");

    await cache.del("test key");

    const deleted = await cache.get("test key");

    await expect(deleted).toBeNull();
});

afterAll(async done => {
    cache.del("test key");
    cache.del("test set");
    cache.disconnect();
    done();
});
