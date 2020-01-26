process._rawDebug = jest.fn();

const db = require("../app/db/db");

const test_table = `${db.table_prefix()}test`;

// TODO it would be great to be able to dynamically create test to test all databases defined on config and not only the default one
// Unfortunatelly it seems Jest cannot handle async dyanmically created async tests: https://github.com/facebook/jest/issues/1619#issuecomment-358576732
// const databases = Object.keys(config.db).filter(db => config.db[db].enabled);

describe('Database tests', () => {

    beforeAll(async done => {
        await db.connect();
        done();
    });

    test("should return a simple select", async () => {
        const uno = await db.sql({ sql: "select 1" });

        await expect(!!uno.rows).toBe(true);

        await expect(uno.rows[0][0]).toBe(1);
    });

    test("should return a simple value", async () => {

        const uno = await db.sqlv({ sql: "select 1" });

        await expect(uno).toBe(1);

    });

    test("should return 2 values in sequence", async () => {

        const uno = await db.sequence();
        const dos = await db.sequence();

        expect(uno).toBeNumber();
        expect(dos).toBeNumber();
        expect(dos).toBeGreaterThan(uno);

    });

    test("create test table and do some DML", async () => {
        await db.sql({ sql: `drop table if exists ${test_table}` });
        await db.sql({ sql: `create table ${test_table} (a int, b varchar(100))` });

        const phase1 = await db.sql({ sql: `select count(*) from ${test_table}` });

        await expect(phase1.rows[0][0]).toBe("0");
        await db.sql({ sql: `insert into ${test_table} (a, b) values (99, 'test')` });

        const phase2 = await db.sql({ sql: `select count(*) from ${test_table}` });

        await expect(phase2.rows[0][0]).toBe("1");

        const phase3 = await db.sql({ sql: `select a from ${test_table}` });

        await expect(phase3.rows[0][0]).toBe(99);
        await db.sql({ sql: `drop table if exists ${test_table}` });
    });

    afterAll(async done => {
        await db.disconnect();
        done();
    });

});