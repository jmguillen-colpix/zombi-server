const config = require("./config");
const stats = require("./stats");
const session = require("./session");
const log = require("./log");
const sockets = require("./sockets");

var l_sequence = 0;

stats.start();

const start = () => {
    const interval = (config.reactor.interval * 1000);

    log("Reactor started, interval " + config.reactor.interval + " seconds", "reactor/start");

    setInterval(async () => {
        l_sequence++;

        try {
            await session.expire();

            stats.run(l_sequence);

            sockets.heartbeat();
        } catch (error) {
            log(error, "reactor/start", true);
        }
    }, interval);
};

module.exports = { start }
