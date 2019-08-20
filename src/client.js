const config = require("./config");
const utils  = require("./utils");
const log    = require("./log");
const radio  = require("./radio");

const _     = require('lodash');
const axios = require('axios');

var seq = 0;


const sequence = () => { return seq++; }

// const websocket = require('ws');

var websocket = require('websocket').client;

const connections = {};

var io_clients = {};
var io_callbacks = {};

function exec(server, params, callback) {

    if(typeof callback === "function") {

        return _exec(server, params, callback);

    } else {

        return new Promise((resolve, reject) => { 
            
            _exec(server, params, (err, res) => {

                if(err) {

                    reject(new Error(err));

                } else {

                    resolve(res);

                }

            });

        });

    }

}

function _exec(server, params, callback) {

    const token = connections[server].token;
    const url   = connections[server].url;

    log(`Calling server on url ${url}`, "client/_exec");

    log(`Token is ${utils.make_token_shorter(token)}`, "client/_exec");

    const merged = {
        token: token,
        module: "",
        function: "",
        args: {},
        config: {},
        sequence: sequence()
    };

    const smarap = (_.isArray(params)) ? {module: params[0], function: params[1], args: params[2]} : params; 
    
    _.merge(merged, smarap);

    radio.emit("ZOMBI_SERVER_CALL_START", [merged.module, merged.function]);

    axios({
        method: 'post',
        url: url,
        data: JSON.stringify(merged),
        responseType: 'json',
        responseEncoding: 'utf8',
        headers: {'Content-Type': 'application/json'},
        validateStatus: (status) => { return true; } // Zombi doesn't care about HTTP codes that much
    }).then((response) => {

        if(
            typeof response.data === "undefined" || 
            typeof response.data.error === "undefined" ||
            typeof response.data.info === "undefined" ||
            typeof response.data.data === "undefined" ||
            typeof response.data.message === "undefined"
        ) {

            if(typeof callback === "function") { callback("Malformed server response", false); }

        } else {

            if(response.data.info.expired) { // Session is expired

                radio.emit("ZOMBI_SERVER_SESSION_EXPIRED", server);

                log(`Session is expired for server ${server}`, "client/_exec", true);

                if(typeof callback === "function") { callback(null, response.data); }

            } else {

                if(typeof callback === "function") { callback(null, response.data); }

            }

        }

        ZOMBI.radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: response.data});

    }).catch((error) => {

        if (error.request) { // The request was made but no response was received. `error.request` is an instance of XMLHttpRequest

            if(typeof callback === "function") { callback(`Server error: ${error.message}`, false); }

            radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: `Server error: ${error.message}`});

        } else { // Something happened in setting up the request that triggered an Error

            if(typeof callback === "function") { callback(`Request error: ${error.message}`, false); }

            radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: `Request error: ${error.message}`});
        }
        
    }).then(() => { // This extra .then() works the same way as jQuery's "always"
        
        radio.emit("ZOMBI_SERVER_CALL_FINISH", [merged.module, merged.function]);

    });

    return merged;
    
}

_sockets = (server) => {

    try {

        connections[server].socket = new websocket();

        connections[server].socket.connect(`${config.peers[server].url}?token=${connections[server].token}`);

        connections[server].socket.on('connectFailed', function(error) {
            console.log('Connect Error: ' + error.toString());

            const reconnect_time = config.sockets.reconnect_time;
    
            log(`Socket closed. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_sockets");

            setTimeout(() => { connections[server].socket.connect(`${config.peers[server].url}?token=${connections[server].token}`); }, reconnect_time);

        });

        connections[server].socket.on('connect', function(connection) {

            console.log('WebSocket Client Connected');
            connection.on('error', function(error) {
                console.log("Connection Error: " + error.toString());
            });

            connection.on('close', function() {

                console.log('echo-protocol Connection Closed');

                const reconnect_time = config.sockets.reconnect_time;
    
                log(`Socket closed. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_sockets");

                setTimeout(() => { connections[server].socket.connect(`${config.peers[server].url}?token=${connections[server].token}`); }, reconnect_time);

            });

            connection.on('message', function(frame) {

                const message = frame.utf8Data;

                // if (message.type === 'utf8') {

                //     console.log("Received: '" + message.utf8Data + "'");

                // }

                log(`Received [${message}]`, "client/_sockets");

                if(message.substring(0, 4) === "ping") { // Server sent hertbeat ping

                    connection.sendUTF("pong");

                } else {

                    const data = JSON.parse(message);

                    radio.emit("ZOMBI_SERVER_SOCKET_RECEIVE", data);

                    if(data.error && data.message) { // Message is a response to a user request because there is no context

                        if(io_callbacks[data.info.sequence]) {

                            io_callbacks[data.info.sequence](data);

                            // TODO this is to prevent io_callbacks to leak. There may be a better solution...
                            setTimeout(() => { delete io_callbacks[data.info.sequence]; }, 0);
                        
                        }

                    }
                    
                }

                
            });
            
            // function sendNumber() {
            //     if (connection.connected) {
            //         var number = Math.round(Math.random() * 0xFFFFFF);
            //         connection.sendUTF(number.toString());
            //         setTimeout(sendNumber, 1000);
            //     }
            // }
            // sendNumber();
        });

        // connections[server].socket = null;

        // log(`Connecting socket to server [${server}]`, "client/_login");

        // connections[server].socket = new websocket(`${config.peers[server].url}?token=${connections[server].token}`);

        // if(true) {

        //     connections[server].socket.on('error', error => {

        //         const reconnect_time = config.sockets.reconnect_time;
    
        //         log(`Socket returned error ${error.message}. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_sockets");
    
        //         setTimeout(() => { _sockets(server); }, reconnect_time);
    
        //     });
    
        //     connections[server].socket.on('open', () => {
    
        //         log(`Connected to server [${server}] via sockects`, "client/_sockets");
    
        //     });
    
        //     connections[server].socket.onclose = event => {
    
        //         radio.emit("ZOMBI_SERVER_SOCKET_DISCONNECTED", server);
    
        //         const reconnect_time = config.sockets.reconnect_time;
    
        //         log(`Socket is closed. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_sockets");
    
        //         setTimeout(() => { _sockets(server); }, reconnect_time);
    
        //     }
                
        //     connections[server].socket.on('message', message => {
    
        //         log(`Received [${message}]`, "client/_sockets");
    
        //         if(message.substring(0, 4) === "ping") { // Server sent hertbeat ping
    
        //             connections[server].socket.send("pong");
    
        //         } else {
    
        //             const data = JSON.parse(message);
    
        //             radio.emit("ZOMBI_SERVER_SOCKET_RECEIVE", data);
    
        //             if(data.error && data.message) { // Message is a response to a user request because there is no context
    
        //                 if(io_callbacks[data.info.sequence]) {
    
        //                     io_callbacks[data.info.sequence](data);
    
        //                     // TODO this is to prevent io_callbacks to leak. There may be a better solution...
        //                     setTimeout(() => { delete io_callbacks[data.info.sequence]; }, 0);
                        
        //                 }
    
        //             }
                    
        //         }
    
        //     });

        // }
        
    } catch (error) {

        log(error.message, "client/_sockets", true);
        
    }
    
}

const _login = async (server) => {

    try {

        var reconnect_time = config.sockets.reconnect_time;
        
        log(`Connecting to server: ${server}`, "client/_login");

        connections[server] = {
            user: config.peers[server].user,
            pass: config.peers[server].pass,
            url:  config.peers[server].url,
            type: config.peers[server].type,
            token: null,
            socket: null
        };

        // console.log(connections);

        const login = await exec(server, ["sys_login", "login", [connections[server].user, connections[server].pass, "en"]]);

        if(login.error) {

            log(login.message, "client/_login", true);
    
            log(`Login to server ${server} failed. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_login");

            setTimeout(async () => { await _login(server); }, reconnect_time);

            return null;

        } else {

            log(`Connected user [${connections[server].user}] to server [${server}] with token ${utils.make_token_shorter(login.data.token)}`, "client/_login");

            connections[server].token = login.data.token;

            if(config.peers[server].sockets) {

                _sockets(server);

            }

            return login.data.token;

        }

    } catch (error) {

        log(`${server}: ${error.message}. Reconnect will be attempted in ${reconnect_time} milliseconds`, "client/_login", true);

        setTimeout(async () => { await _login(server); }, reconnect_time);
        
    }

}

const connect = async () => {

    try {
        
        const servers = Object.keys(config.peers);

        log("Will connect to servers: " + servers.join(", "), "client/connect");

        for (const server of servers) {

            const token = await _login(server);

            

            // switch(server_type) {

            //     case "ws": db[server_name] = require("./abstraction/postgresql"); break;

            //     case "http": db[server_name] = require("./abstraction/oracle"); break;

            //     default: throw new Error("Wrong DB Type, check config file");
            
            // }
            
        }

        radio.turnon("ZOMBI_SERVER_SESSION_EXPIRED", server => {

            _login(server);
        
        });

    } catch (error) {

        log(error.message, "client/connect", true);
        
    }

}

module.exports = { connect, exec }

// const ___exec = async (server, params, callback) => {

//     try {
        
//         const servers = Object.keys(config.peers);

//         log("Will connect to servers: " + servers.join(", "), "client/connect");

//         for (const server_name of servers) {

//             // let server_type = config.peers[server_name].type;

//             connections[server_name] = {

//                 user: config.peers[server_name].user,
//                 pass: config.peers[server_name].pass,
//                 url:  config.peers[server_name].url,
//                 type: config.peers[server_name].type,
//                 token: null,


//             };

//             console.log(connections);

//             const login = await server(server_name, ["sys_login", "login", [connections[server_name].user, connections[server_name].pass, "en"]]);

//             if(login.error) {

//                 log(login.message, "client/connect", true);

//             } else {

//                 log(`Client token is ${login.data.token}`);

//                 connections[server_name].token = login.data.token;

//             }

//             console.log(login);



//             // switch(server_type) {

//             //     case "ws": db[server_name] = require("./abstraction/postgresql"); break;

//             //     case "http": db[server_name] = require("./abstraction/oracle"); break;

//             //     default: throw new Error("Wrong DB Type, check config file");
            
//             // }
            
//         }

//     } catch (error) {

//         log(error, "client/connect", true);
        
//     }

    

// }




// const io_callbacks = {};


// // const url = require('url');

// // const wss = new websocket.Server({ server: http_server, clientTracking: false });


// const reconnect_time = 1000;

// const ws = new websocket('ws://192.168.0.199:8081?token=xxx');

// ws.on('open', function open() {
//   console.log('connected');
// //   ws.send(Date.now());
// });

// ws.on('close', function close() {

//     console.log('disconnected');

//     log(`Socket is closed. Reconnect will be attempted in ${reconnect_time} millisecond`, "client/on.close");

//     setTimeout(() => { connect(); }, reconnect_time);

// });

// ws.on('message', function incoming(data) {
    
//     log("Message: " + data, "client/on.message");

//     if(data.substring(0, 4) === "ping") { // Server sent hertbeat ping

//         if (ws && ws.readyState && ws.readyState === WebSocket.OPEN) {

//             log("Server sent ping, answering with pong", "client/on.message");

//             ws.send("pong");

//         } else {

//             log("Cannot answer ping, not connected", "client/on.message");

//         }

//     } else {

//         const data = JSON.parse(data);

//         // ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_RECEIVE", data);

//         if(data.error && data.message) { // Message is a response to a user request because there is no context

//             if(io_callbacks[data.info.sequence]) {

//                 io_callbacks[data.info.sequence](data);

//                 // TODO this is to prevent io_callbacks to leak. There may be a better solution...
//                 setTimeout(() => { delete io_callbacks[data.info.sequence]; }, 0);
            
//             }

//         }
        
//     }

// });

// close = () => { ws.close(); };

// module.exports = { close }

// connect = (keep = true) => {

//     if(ZOMBI.config("SOCKETS_CONNECT_ENABLED")) {

//         const token = ZOMBI.token();

//         if(token === null) {

//             log("Token not set, reconnecting later", "IO");

//             setTimeout(() => { ZOMBI.io.connect(); }, ZOMBI.config("SOCKETS_RECCONNECT_TIME"));

//         } else if (keep && io_client && io_client.readyState && io_client.readyState === 1) {

//             log("Already connected to server", "IO");

//         } else {

//             const url = `ws://${location.hostname}:${location.port}?token=${ZOMBI.token()}`;

//             log("Connecting to " + url, "IO");

//             io_client = new WebSocket(url);

//             io_client.onopen = () => {

//                 ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_CONNECTED");

//                 log("Connected", "IO");
            
//             };

//             io_client.onclose = event => {

//                 ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_DISCONNECTED");

//                 const reconnect_time = ZOMBI.config("SOCKETS_RECCONNECT_TIME");

//                 log(`Socket is closed. Reconnect will be attempted in ${reconnect_time} millisecond: ${event.reason}`, "IO");

//                 setTimeout(() => { ZOMBI.io.connect(); }, reconnect_time);
    
//             };

//             io_client.onmessage = event => {

//                 log("Message: " + event.data, "IO");

//                 if(event.data.substring(0, 4) === "ping") { // Server sent hertbeat ping

//                     if (io_client && io_client.readyState && io_client.readyState === 1) {

//                         log("Server sent ping, answering with pong", "IO");

//                         io_client.send("pong");

//                     } else {

//                         log("Cannot answer ping, not connected", "IO");

//                     }

//                 } else {

//                     const data = JSON.parse(event.data);

//                     ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_RECEIVE", data);

//                     if(data.error && data.message) { // Message is a response to a user request because there is no context

//                         if(io_callbacks[data.info.sequence]) {

//                             io_callbacks[data.info.sequence](data);

//                             // TODO this is to prevent io_callbacks to leak. There may be a better solution...
//                             setTimeout(() => { delete io_callbacks[data.info.sequence]; }, 0);
                        
//                         }

//                     }
                    
//                 }

//             };

//             io_client.onerror = event => {

//                 log("Connection error", "IO");

//             };

//         }

//     } else {

//         log("IO: Connection disabled on config");

//     }

// },

// send(params, callback) {

//     const base = {
//         token: ZOMBI.token(),
//         module: "",
//         function: "",
//         args: {},
//         config: {},
//         sequence: ZOMBI.sequence()
//     };

//     const smarap = (ZOMBI.utils.is_array(params)) ? {module: params[0], function: params[1], args: params[2]} : params; 
    
//     const merged = ZOMBI.utils.extend(true, base, smarap);

//     if(typeof callback === "function") { io_callbacks[sequence] = callback; }

//     io_client.send(JSON.stringify(merged));

//     ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_SEND", merged);

//     return merged;
    
// }