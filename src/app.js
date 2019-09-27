const config  = require("./config");
const server  = require("./server");
const i18n    = require("./i18n");
const reactor = require("./reactor");
const session = require("./session");
const log     = require("./log");
const db      = require("./db/db");
const stats   = require("./stats");
const sockets = require("./sockets");
const client  = require("./client");

const cors = require("cors");
const path = require("path");
const express = require("express");
const compression = require("compression");

const websocket = require('ws');
const url = require('url');

const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, "..", config.server.public_directory)));
app.use(express.json());
app.use(cors());

app.post(config.server.endpoint, async (req, res) => {

    try {

        stats.oup();

        // https://github.com/expressjs/express/issues/3330
        req.setTimeout(config.server.request_timeout * 1000);
    
        const mod   = req.body.module;
        const fun   = req.body.function;
        const args  = req.body.args;
        const token = req.body.token;
        var   seq   = req.body.sequence; // We want this also visible on the catch block
    
        // This is to get IP Address from HAProxy directed requests 
        const ip = req.header("x-forwarded-for") || req.connection.remoteAddress;
        const ua = req.get("User-Agent");
    
        await session.start(token);

        res.json(await server.execute(mod, fun, args, token, seq, ip, ua));

        await session.save(token);
        
    } catch (error) {

        stats.eup();

        res.json(server.response(true, error.message, null, seq));
        
    }

});

// Custom 404 page
app.use((req, res) => {

    log("404 for url " + req.url, "main", true);

    res.status(404).sendFile(path.join(__dirname, "../public/404.html"));

});

// Server startup
const http_server = app.listen(

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
    const { query: { token } } = url.parse(req.url, true);

    sockets.add_client(token, ws);

    ws.on('message', async message => {

        try {

            stats.oup();

            if(message === "pong") {

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
        
                await session.start(token);
                
                ws.send(JSON.stringify(await server.execute(mod, fun, args, token, seq, ip, ua)));
            
                await session.save(token);

            }

        } catch (error) {

            ws.send(JSON.stringify(server.response(true, error.message, null, seq)));
            
        }
    
    });

});

// Shutwdown sequence
process.once("SIGINT", code => {

    log(code + " signal received", "main/sigint");

    http_server.close();

});

process.once("SIGTERM", code => {

    log(code + " signal received", "main/sigterm");

    http_server.close();

});

http_server.once("close", () => {

    log("Shutting down server", "shutdown");

    server.shutdown();

    db.shutdown();

    // We wait for async shutdown functions to terminate
    setTimeout(() => { log("shutdown"); }, 1400);
    setTimeout(() => { process.exit(0); }, 1800);

});