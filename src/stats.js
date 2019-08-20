const config = require("./config");
const utils  = require('./utils');
const log    = require("./log");
// const i18n    = require("./i18n");
// const cache   = require("./cache");
const db     = require("./db/db");

const si = require('systeminformation');

const get_empty_data = () => {

    return {
        ops: 0,
        nop: 0,
        eps: 0,
        noe: 0,
        tor: 0, // Total requests
        ret: 0, // Requests time
        tav: 0, // Average time
        tmi: -1,// Time min
        tma: 0, // Time max
        dbr: 0, // DB requests
        dbe: 0, // DB errors
    };

};

var stats_data = get_empty_data();

const oup = () => { stats_data.nop++; };
const eup = () => { stats_data.noe++; };

const dup = () => { stats_data.dbr++; };
const rup = () => { stats_data.dbe++; };

const tup = (time) => {
    
    stats_data.ret = stats_data.ret + time;

    stats_data.tor++;

    if(stats_data.tmi === -1 || stats_data.tmi > time) { stats_data.tmi = time; }

    if(stats_data.tma < time) { stats_data.tma = time; }

};

const stats_reset = () => { stats_data = get_empty_data(); }

const stats_info = () => { return stats_data; }

const start = () => {

    const sample_ops = stats_data.nop;
    const sample_err = stats_data.noe;

    setTimeout(() => {

        const delta_ops = stats_data.nop - sample_ops;
        const delta_err = stats_data.noe - sample_err;

        stats_data.ops = Math.round(delta_ops/60);
        stats_data.eps = Math.round(delta_err/60);

        stats_data.tav = (stats_data.tor === 0) ? 0 : Math.round(stats_data.ret/stats_data.tor);

        log("OPS:" + stats_data.nop + " OPS/s:" + stats_data.ops + " ERR:" + stats_data.noe + " ERR/s:" + stats_data.eps + " RES:" + stats_data.tor + " AVG:" + stats_data.tav + " MIN:" + stats_data.tmi + " MAX:" + stats_data.tma + " DBR:" + stats_data.dbr + " DBE:" + stats_data.dbe, "stats/counters");

        start();
    
    }, 60000);

}

const run = (reactor_sequence) => {

    try {

        // const {rss, heapTotal, heapUsed, external } = process.memoryUsage();
        const { rss } = process.memoryUsage();

        log(`Memory usage total (RSS): ${(rss/1024/1204).toFixed(2)} MB`, "stats/run");

        if(config.inst.save_disk_data && (reactor_sequence % config.inst.save_disk_skip === 0)) {

            log("Saving disk status data", "stats/save disk");

            si.fsSize(async data => {

                for (const disk of data) {

                    const seq = await db.sequence();

                    const sql = `insert into ${db.table_prefix()}inst_disk (ID, NODE_NAME, DISK_SIZE, SPACE_USED, PCT_USED, MOUNT_POINT, TS, DISK_DEVICE) values (:id, :node_name, :disk_size, :space_used, :pct_used, :mount_point, :ts, :disk_device)`;

                    await db.sql(sql, [seq, config.node_name, disk.size, disk.used, disk.use, disk.mount, utils.timestamp(), disk.fs]);

                }

            });

        }

        if(config.inst.save_cpu_data && (reactor_sequence % config.inst.save_cpu_skip === 0)) {

            log("Saving CPU status", "stats/save cpu");

            si.currentLoad(async data => {

                const seq = await db.sequence();

                const sql = `insert into ${db.table_prefix()}inst_cpu (ID, NODE_NAME, CPU_USER, CPU_NICE, CPU_SYSTEM, CPU_IOWAIT, CPU_STEAL, CPU_IDLE, TS) values (:id, :node_name, :cpu_user, :cpu_nice, :cpu_system, :cpu_iowait, :cpu_steal, :cpu_idle, :ts)`;

                await db.sql(sql, [seq, config.node_name, data.currentload_user, data.currentload_nice, data.currentload_system, null, null, data.currentload_idle, utils.timestamp()]);
                    
            });

        }

        if(config.inst.save_mem_data && (reactor_sequence % config.inst.save_mem_skip === 0)) {

            log("Saving memory stats data", "stats/save memory");

            si.mem(async data => {

                const seq = await db.sequence();

                const sql = `insert into ${db.table_prefix()}inst_memory (ID, NODE_NAME, TS, TOTAL, FREE, USED, ACTIVE, AVAILABLE, BUFFCACHE, SWAPTOTAL, SWAPUSED, SWAPFREE) values (:id, :node_name, :ts, :total, :free, :used, :active, :available, :buffcache, :swaptotal, :swapused, :swapfree)`;

                await db.sql(sql, [seq, config.node_name, utils.timestamp(), data.total, data.free, data.used, data.active, data.available, data.buffcache, data.swaptotal, data.swapused, data.swapfree]);
                    
            });

        }
            
    } catch (error) {

        log(error.message, "stats/run", true);
        
    }

};

module.exports = { start, run, oup, eup, tup, stats_info, stats_reset, dup, rup }

/* 
Example of disks result
{
    "fs": "/dev/sda3",
    "type": "xfs",
    "size": 104100007936,
    "used": 1901244416,
    "use": 1.83,
    "mount": "/"
},

*/