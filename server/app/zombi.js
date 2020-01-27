"use strict";

const config = require("./config");
const server = require("./server");
const i18n = require("./i18n");
const reactor = require("./reactor");
const log = require("./log");
const db = require("./db/db");
const stats = require("./stats");
const cache = require("./cache");
const sockets = require("./sockets");
const security = require("./security");

const fs = require("fs");
const http = require("http");
const urlm = require("url");
const path = require("path");
const mime = require("mime-types");

const websocket = require("ws");

const http_server = http.createServer((req, res) => {

    let sequence, mod, fun;

    const data = [];
    const { method, url, headers } = req;

    res.setHeader("Access-Control-Allow-Origin", config.security.cors.origin);
    res.setHeader("Access-Control-Allow-Methods", config.security.cors.methods);
    res.setHeader("Access-Control-Allow-Headers", config.security.cors.headers);

    if (url === config.server.endpoint) {

        switch (method) {
            case "OPTIONS":
                res.statusCode = 204;
                res.end("ok");
                break;

            case "POST":
                res.setHeader("Content-type", "application/json");

                req.on("data", chunk => data.push(chunk));

                req.on("end", async () => {

                    try {

                        stats.oup();

                        const params = JSON.parse(data.toString());

                        const { args, token } = params;
                        mod = params.mod;
                        fun = params.fun;
                        sequence = params.sequence;

                        // This is to get IP Address from HAProxy or directed requests
                        const ip = headers["x-forwarded-for"] || res.socket.remoteAddress;
                        const ua = headers["user-agent"];

                        res.end(
                            JSON.stringify(
                                await server.execute(
                                    mod, 
                                    fun, 
                                    args, 
                                    token, 
                                    sequence, 
                                    ip, 
                                    ua
                                )
                            )
                        );
                        
                    } catch (error) {

                        log(error, "zombi", true);

                        stats.eup();

                        res.statusCode = 500;

                        res.end(
                            JSON.stringify(
                                server.response({ 
                                    error: true,
                                    code: 500,
                                    message: config.server.hide_errors_500 ? "Server error" : `${mod}/${fun}: ${error.message}`, 
                                    sequence 
                                })
                            )
                        );

                    }

                });
                break;

            default:
                log(`Invalid method ${method}`, "zombi", true);
                res.statusCode = 500;
                res.end(
                    JSON.stringify(
                        server.response({ 
                            error: true, 
                            code: 500, 
                            message: config.server.hide_errors_500 ? "Server error" : `Invalid method ${method}`, 
                            sequence 
                        })
                    )
                );
                break;
        }

    } else {

        const public_directory = config.server.public_directory;

        const file_path = public_directory.substr(0, 1) === "/"
            ? path.join(public_directory, security.sanitize_path(req.url))
            : path.join(__dirname, "../../", public_directory, security.sanitize_path(req.url));

        const file_name = (req.url === "/") ? `${file_path}index.html` : file_path;

        const mime_type = mime.lookup(path.parse(file_name).ext);

        fs.readFile(file_name, (err, data) => {
            res.setHeader("Content-type", mime_type || "text/plain");

            if (err) {
                log(err, "zombi", true);

                res.statusCode = 404;
                res.end(`File not found: ${err}.`);
            } else {
                res.end(data);
            }
        });

    }

});

const wss = new websocket.Server({ server: http_server, clientTracking: false });

wss.on("connection", (ws, req) => {
    // https://github.com/nodejs/node/issues/23694
    // eslint-disable-next-line node/no-deprecated-api
    const { query: { token } } = urlm.parse(req.url, true);

    sockets.add_client(token, ws);

    ws.on("message", async message => {

        let sequence, mod, fun;

        try {

            stats.oup();

            if (message === "pong") {

                sockets.is_alive(token);

            } else {
                
                const params = JSON.parse(message);

                const { args, token } = params;
                mod = params.mod;
                fun = params.fun;
                sequence = params.sequence;

                // This is to get IP Address from HAProxy or directed requests
                const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                const ua = req.headers["user-agent"];

                ws.send(
                    JSON.stringify(
                        await server.execute(
                            mod, 
                            fun, 
                            args, 
                            token, 
                            sequence, 
                            ip, 
                            ua
                        )
                    )
                );

            }

        } catch (error) {

            log(error, "zombi", true);

            ws.send(
                JSON.stringify(
                    server.response({ 
                        error: true,
                        code: 500,
                        message: config.server.hide_errors_500 ? "Server error" : `${mod}/${fun}: ${error.message}`, 
                        sequence 
                    })
                )
            );

        }

    });

});

http_server.listen(

    config.server.http_port,

    async () => {

        log(`Hello, I am ${config.node_name} serving HTTP on port ${config.server.http_port}`, "main");

        try {

            cache.connect();
            await db.connect();
            await i18n.load_labels();

            reactor.start();

        } catch (error) {

            log(error, "app/startup", true);

            http_server.close(async () => {
            
                await db.disconnect();
                cache.disconnect();
            
                process.exit(1);
            
            });

        }

    }

);

module.exports = http_server;