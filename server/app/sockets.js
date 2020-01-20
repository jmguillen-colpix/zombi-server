const config = require("./config");
const utils = require("./utils");
const log = require("./log");
const session = require("./session");

var clients = {};

const add_client = (token, ws) => {
    try {
        log("New WS client for token " + utils.make_token_shorter(token), "sockets/add_client");

        // TODO Shall we check if there is already an entry with the same token?
        clients[token] = { ws: ws, timestamp: utils.timestamp(), is_alive: true };
    } catch (error) {
        log(error.message, "sockets/add_client", true);
    }
};

const is_alive = token => {
    try {
        const short_token = utils.make_token_shorter(token);

        if (clients[token]) {
            clients[token].is_alive = true;

            clients[token].timestamp = utils.timestamp();

            log(`Client responded ping with pong, token: ${short_token}`, "sockets/is_alive");
        } else {
            log(`Client sent pong but is not on client list, token: ${short_token}`, "sockets/is_alive", true);
        }
    } catch (error) {
        log(error.message, "sockets/is_alive", true);
    }
};

// https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
const heartbeat = () => {
    try {
        const tokens = Object.keys(clients);

        if (tokens.length === 0) { log("Nobody is connected", "sockets/heartbeat") }

        for (const token of tokens) {
            if (clients[token].ws.readyState === 1) {
                clients[token].ws.send("ping", {}, error => {
                    if (error) {
                        clients[token].is_alive = false;

                        log(error.message, "sockets/heartbeat", true);
                    } else {
                        log("Pinged token " + utils.make_token_shorter(token), "sockets/heartbeat");
                    }
                });
            } else {
                clients[token].is_alive = false;
            }
        }

        const limit = config.sockets.ping_response_time_limit;

        setTimeout(() => {
            for (const token of tokens) {
                if (!clients[token].is_alive || clients[token].timestamp < (utils.timestamp() - (limit * 1.2 / 1000))) {
                    delete clients[token];

                    log(`Deleted WS client with token ${utils.make_token_shorter(token)}`, "sockets/heartbeat");
                }
            }
        }, limit);
    } catch (error) {
        log(error.message, "sockets/heartbeat", true);
    }
};

const send_message_to_session = (token, context = "NO_CONTEXT", data = []) => {
    try {
        const short_token = utils.make_token_shorter(token);

        if (clients[token]) {
            log(`Sending message to token: ${short_token}`, "sockets/send_message_to_session");

            clients[token].ws.send(JSON.stringify({ context, data }), {}, (error) => {
                if (error) {
                    clients[token].is_alive = false;

                    log(error.message, "sockets/send_message_to_session", true);
                }
            });
        } else {
            log(`Client not found for token: ${short_token}`, "sockets/send_message_to_session");
        }
    } catch (error) {
        log(error.message, "sockets/send_message_to_session", true);
    }
};

const send_message_to_user = async (user_id = null, context = "none", data = []) => {
    try {
        const tokens = await session.tokens(user_id);

        for (const token of tokens) {
            const user_name = await session.get(token, "full_name")

            log(`Sending message to ${user_name}, token: ${utils.make_token_shorter(token)}`, "sockets/send_message_to_user");

            await send_message_to_session(token, context, data);
        }
    } catch (error) {
        log(error.message, "sockets/send_message_to_user", true);

        throw (error);
    }
};

const send_message_broadcast = async (context = "none", data = []) => {
    try {
        await send_message_to_user(null, context, data);
    } catch (error) {
        log(error.message, "sockets/send_message_broadcast", true);

        throw (error);
    }
};

module.exports = {
    add_client,
    send_message_to_session,
    send_message_to_user,
    send_message_broadcast,
    is_alive,
    heartbeat
};
