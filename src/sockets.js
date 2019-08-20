const config  = require("./config");
const utils   = require("./utils");
const log     = require("./log");
const db      = require("./db/db");
const session = require("./session");

var clients = {};

/* 
readyState
0	CONNECTING	Socket has been created. The connection is not yet open.
1	OPEN	    The connection is open and ready to communicate.
2	CLOSING	    The connection is in the process of closing.
3	CLOSED	    The connection is closed or couldn't be opened.
*/

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

        if(clients[token]) {

            clients[token].is_alive = true;

            clients[token].timestamp = utils.timestamp();

            log("It's alive! " + utils.make_token_shorter(token), "sockets/is_alive");

        }

    } catch (error) {

        log(error.message, "sockets/add_client", true);

    }

};

// https://github.com/websockets/ws#how-to-detect-and-close-broken-connections
const heartbeat = () => {

    try {

        const tokens = Object.keys(clients);

        if(tokens.length === 0) { log("Nobody is connected", "sockets/heartbeat")}

        for (const token of tokens) {

            if(clients[token].ws.readyState === 1) {

                clients[token].ws.send("ping", {}, (error) => {

                    if(error) {
    
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

        setTimeout(() => {

            for (const token of tokens) {

                if(clients[token].is_alive === false) {
    
                    delete clients[token];
        
                    log("Deleted WS client with token " + utils.make_token_shorter(token), "sockets/heartbeat");
        
                }
                
            }

        }, config.sockets.ping_response_time_limit);

    } catch (error) {

        log(error.message, "sockets/heartbeat", true);

    }

};

const send_message_to_session = (token, context = "none", data = []) => {

    try {

        if(clients[token]) {

            log("Sending message to token: " + utils.make_token_shorter(token), "sockets/send_message_to_session");

            clients[token].ws.send(JSON.stringify({context, data}), {}, (error) => {

                if(error) {

                    clients[token].is_alive = false;
                    
                    log(error.message, "sockets/send_message_to_session", true);
                
                }

            });

        } else {

            log("Client not found for token: " + utils.make_token_shorter(token), "sockets/send_message_to_session");

        }

    } catch (error) {

        log(error.message, "sockets/send_message_to_session", true);
        
    }

};

const send_message_to_user = async (user_id, context = "none", data = []) => {

    try {

        const reply = await db.sql(`select token from ${db.table_prefix()}sessions where user_id = :user_id`, [user_id]);

        if(reply.info.rows === 0) {

            throw new Error("No session found for user ID " + user_id);

        } else {

            for (const row of reply.rows) {

                const token = row[0];

                const user_name = session.get(token, "full_name")

                log("Sending message " + user_name + ", token: " + utils.make_token_shorter(token), "sockets/send_message_to_user");

                send_message_to_session(token, context, data);

            }
            
        }

    } catch (error) {

        log(error.message, "sockets/send_message_to_user", true);

        throw(error);
        
    }

};

const send_message_broadcast = async (context = "none", data = []) => {

    try {

        const reply = await db.sql("select token from zombi_sessions");

        if(reply.info.rows === 0) {

            throw new Error("No sessions found");

        } else {

            for (const row of reply.rows) {

                const token = row[0];

                const user_name = session.get(token, "full_name")

                log("Sending message " + user_name + ", token: " + utils.make_token_shorter(token), "sockets/send_message_broadcast");

                send_message_to_session(token, context, data);

            }
            
        }

    } catch (error) {

        log(error.message, "sockets/send_message_broadcast", true);

        throw(error);
        
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