const config = require("./config");
const server = require("./server");
const i18n = require("./i18n");
const reactor = require("./reactor");
// const session = require("./session");
const log = require("./log");
const db = require("./db/db");
const stats = require("./stats");
const sockets = require("./sockets");
const security = require("./security");
// const client = require("./client");
// const cache = require("./cache");

const http = require('http');
const urlm = require('url');
const fs   = require('fs');
const path = require('path');

const websocket = require('ws');

const http_server = http.createServer((req, res) => {

    const { method, url, headers } = req;

    // CORS: https://www.html5rocks.com/en/tutorials/cors/
    res.setHeader('Access-Control-Allow-Origin',  config.security.cors.origin);
    res.setHeader('Access-Control-Allow-Methods', config.security.cors.methods);
    res.setHeader('Access-Control-Allow-Headers', config.security.cors.headers);

    if (url === config.server.endpoint) {

        switch (method) {
            
            case "OPTIONS": 

                res.statusCode = 204;
                res.end("ok");
                break;

            case "POST": 

                let data = [];
            
                req.on('data', chunk => data.push(chunk));
        
                req.on('end', async () => {
        
                    try {
        
                        stats.oup();
        
                        // https://github.com/expressjs/express/issues/3330
                        req.setTimeout(config.server.request_timeout * 1000);
        
                        const post_data = JSON.parse(data.toString());
        
                        const mod   = post_data.module;
                        const fun   = post_data.function;
                        const args  = post_data.args;
                        const token = post_data.token;
                        var   seq   = post_data.sequence; // We want this also visible on the catch block
        
                        // This is to get IP Address from HAProxy directed requests 
                        const ip = headers["x-forwarded-for"] || res.socket.remoteAddress;
                        const ua = headers["user-agent"];
        
                        res.end(JSON.stringify(await server.execute(mod, fun, args, token, seq, ip, ua)));
        
                    } catch (error) {
        
                        stats.eup();
        
                        res.end(JSON.stringify(server.response(true, error.message, null, seq)));
        
                    }
        
                });

                break;
        
            default:

                    res.statusCode = 500;
                    res.end(`Invalid method ${method}`);

                break;
        }

    } else {

        let file_path = security.sanitize_path(req.url);

        // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
        // const sanitize_path = path.normalize(parsed_url.pathname).replace(/^(\.\.[\/\\])+/, '');

        // let pathname = path.join(__dirname + "/..", config.server.public_directory + sanitize_path);

        fs.exists(file_path, (exist: Boolean) => {

            if (!exist) {

                res.statusCode = 404;
                res.end(`File ${file_path} not found!`);
                
            } else {

                file_path = (fs.statSync(file_path).isDirectory()) ? file_path += '/index.html' : file_path;

                fs.readFile(file_path, function (err: Boolean, data: Buffer) {

                    if (err) {
                        res.statusCode = 404;
                        res.end(`File not found: ${err}.`);
                    } else {
                        const ext = path.parse(file_path).ext;
                        res.setHeader('Content-type', server.mime(ext) || 'text/plain');
                        res.end(data);
                    }

                });

            }

        });

    }

});

// Server startup
http_server.listen(

    config.server.http_port,

    async () => {

        log(`Hello, I am ${config.node_name} serving HTTP on port ${config.server.http_port}`, "main");

        try {

            await db.connect();

            await i18n.load_labels();

            reactor.start();

            // await client.connect();

        } catch (error) {

            log(error.message, "app/startup", true);

            http_server.close();

        }

    }

);

const wss = new websocket.Server({ server: http_server, clientTracking: false });

wss.on('connection', (ws, req) => {

    // https://github.com/nodejs/node/issues/23694
    const { query: { token } } = urlm.parse(req.url, true);

    sockets.add_client(token, ws);

    ws.on('message', async message => {

        try {

            stats.oup();

            if (message === "pong") {

                sockets.is_alive(token);

            } else {

                const params = JSON.parse(message);

                const mod   = params.module;
                const fun   = params.function;
                const args  = params.args;
                const token = params.token;
                var   seq   = params.sequence;

                // This is to get IP Address from HAProxy directed requests 
                const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
                const ua = req.headers["user-agent"];

                // sockets.is_alive(token);

                ws.send(JSON.stringify(await server.execute(mod, fun, args, token, seq, ip, ua)));

            }

        } catch (error) {

            ws.send(JSON.stringify(server.response(true, error.message, null, seq)));

        }

    });

});

