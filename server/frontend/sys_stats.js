"use strict";

const config = require("../app/config");
const stats = require("../app/stats");
const db = require("../app/db/db");

const os = require("os");

/**
sys_login/server_status_data

This function obtains performance and use information from the server

Arguments:
    None

Returns:
    An array with server information
*/
const server_status_data = async (args, extras) => {

    try {

        const results = [];

        let sql, reply;

        sql = `select mount_point, disk_size, space_used, round((space_used*100)/disk_size) pct_used from ${db.table_prefix()}inst_disk where ts = (select max(ts) from ${db.table_prefix()}inst_disk where node_name = :node_name)`;

        reply = await db.sql({ sql, bind: [config.node_name] });

        results.push(reply.rows[0]);

        sql = `select round(case when avg(100-cpu_idle) is null then 0 else avg(100-cpu_idle) end, 2) from ${db.table_prefix()}inst_cpu where ts > :limit and node_name = :node_name`;

        reply = await db.sql({ sql, bind: [Math.floor(new Date() / 1000) - 3600, config.node_name] });

        results.push(reply.rows[0]);

        sql = `select total, free, swaptotal, swapfree from ${db.table_prefix()}inst_memory where ts = (select max(ts) from ${db.table_prefix()}inst_memory where node_name = :node_name)`;

        reply = await db.sql({ sql, bind: [config.node_name] });

        results.push(reply.rows[0]);

        results.push(os.hostname());
        results.push(os.platform());
        results.push(os.release());
        results.push(os.uptime());

        results.push(stats.stats_info());

        return [false, results];

    } catch (error) { return [true, null, error.message]; }

};

/**
sys_login/server_stats_clear

This function clear stats data

Arguments:
    None

Returns:
    An array with server information
*/
const server_stats_clear = async (args, extras) => { stats.stats_reset(); return [false]; };

module.exports = { server_stats_clear, server_status_data }
