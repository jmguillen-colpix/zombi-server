// process._rawDebug = jest.fn();

const config = require("../app/config");
const server = require("../app/zombi");
const security = require("../app/security");
const sockets = require("../app/sockets");
const session = require("../app/session");

const request = require("supertest");
const W3CWebSocket = require("websocket").w3cwebsocket;

let token = null;

describe('Test server API functions', () => {

    test('should login via HTTP', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                mod: "sys_login",
                fun: "login",
                args: [
                    process.env.ZOMBI_TEST_LOGIN_USERNAME,
                    process.env.ZOMBI_TEST_LOGIN_PASSWORD,
                    process.env.ZOMBI_TEST_LOGIN_LANGUAGE
                ]
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect((JSON.parse(res.text).data.token).length).toEqual(2*config.security.token_size);
                    token = JSON.parse(res.text).data.token;
                    done();
                }

            });
    });

    test('should return code 1000 on not authorized user', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                token,
                mod: "sys_tests",
                fun: "none",
                args: []
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect(JSON.parse(res.text).code).toEqual(1000);
                    done();
                }

            });
    });

    test('should return code 1001 on non existent token (no login)', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                mod: "mod",
                fun: "fun",
                args: []
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect(JSON.parse(res.text).code).toEqual(1001);
                    done();
                }

            });
    });

    test('should return code 1003 on wrong fun name', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                token,
                mod: "sys_login",
                fun: "---------",
                args: []
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect(JSON.parse(res.text).code).toEqual(1003);
                    done();
                }

            });
    });

    test('should return code 1004 on wrong login', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                mod: "sys_login",
                fun: "login",
                args: []
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect(JSON.parse(res.text).code).toEqual(1004);
                    done();
                }

            });
    });

    test('should return code 1005 on wrong language', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                mod: "sys_login",
                fun: "login",
                args: [
                    process.env.ZOMBI_TEST_LOGIN_USERNAME,
                    process.env.ZOMBI_TEST_LOGIN_PASSWORD,
                    "xx"
                ]
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', "application/json")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                else {
                    expect(JSON.parse(res.text).code).toEqual(1005);
                    done();
                }

            });
    });

    test('should return error code 500 on wrong HTTP method', done => {
        request(server)
            .put(config.server.endpoint)
            .set('Accept', 'application/json')
            .expect(500)
            .end(() => { done(); })
    });

    test("should start via websockets", async done => {
        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({
                token,
                mod: "sys_login",
                fun: "start",
                args: []
            }));
        };

        ws.onmessage = msg => {
            // TODO add more checks
            expect(JSON.parse(msg.data).error).toEqual(false);
            ws.close();
        };

        ws.onclose = () => done();
    });

    test("should send broadcast via websockets", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = async () => {
            await sockets.send_message_broadcast("test_context", "test_broadcast");
        };

        ws.onmessage = msg => {
            expect(JSON.parse(msg.data).data).toEqual("test_broadcast");
            ws.close();
        };

        ws.onclose = () => done();

    });

    test("should send message to user via websockets", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        const user_id = parseInt(await session.get(token, "user_id"));

        ws.onopen = async () => {
            await sockets.send_message_to_user(user_id, "test_context", "test_user");
        };

        ws.onmessage = msg => {
            expect(JSON.parse(msg.data).data).toEqual("test_user");
            ws.close();
        };

        ws.onclose = () => done();

    });

    test("should send message to session via websockets", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = async () => {
            await sockets.send_message_to_session(token, "test_context", "test_token");
        };

        ws.onmessage = msg => {
            expect(JSON.parse(msg.data).data).toEqual("test_token");
            ws.close();
        };

        ws.onclose = () => done();

    });

    test("should heartbeat ping from server", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = async () => {
            await sockets.heartbeat();
        };

        ws.onmessage = msg => {
            expect(msg.data).toEqual("ping");
            ws.close();
        };

        ws.onclose = () => done();

    });
});

// describe("Testing HTTP server", () => {
//     test("should get 404 on non existent key", async done => {
//         await request(server)
//             .get("/server?key=1&token=12345")
//             .expect(404);

//         done();
//     });



//     test("should get 200 on existent key", async done => {
//         const res = await request(server).get("/server?key=test&token=12345");

//         expect(res.statusCode).toEqual(200);
//         expect(JSON.parse(res.text)).toHaveProperty("error");
//         expect(JSON.parse(res.text)).toHaveProperty("message");

//         done();
//     });
// });



describe("Security tests", () => {

    test("should check the user is admin", async done => {

        expect(await security.user_is_admin(token));

        done();
    });

    test("should not authorize user with fake token", async done => {

        expect(await security.authorize("false token", "sys_login")).toBe(false);;

        done();
    });

    test("should return a sanitized url", done => {
        const urls = {
            "/server/../malware.js": "/malware.js",
            "/../..": "/"
        };

        Object.keys(urls).forEach(url => {
            expect(security.sanitize_path(url)).toEqual(urls[url]);
        });

        done();
    });


    test("should hash and compate pasword with hash", async done => {

        const password_hash = await security.password_hash("test_pasword");

        expect(await security.password_compare("test_pasword", password_hash));

        done();
    });

});