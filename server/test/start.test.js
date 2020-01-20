console.log = jest.fn();

const config = require("../app/config");
const server = require("../app/zombi");
const security = require("../app/security");
const sockets = require("../app/sockets");

const request = require("supertest");
const W3CWebSocket = require("websocket").w3cwebsocket;

let token = null;

describe('Login and get a token', () => {

    it('should login via HTTP', done => {
        request(server)
            .post(config.server.endpoint)
            .send({
                module: "sys_login",
                function: "login",
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
                    token = JSON.parse(res.text).data.token;
                    done();
                }

            });
    });



    it("should start via websockets", async done => {
        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({
                token,
                module: "sys_login",
                function: "start",
                args: []
            }));
        };

        ws.onmessage = msg => {
            expect(JSON.parse(msg.data).error).toEqual(false);
            ws.close();
        };

        ws.onclose = () => done();
    });

    it("should send broadcast via websockets", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = async () => {
            await sockets.send_message_broadcast("test_context", "test_broadcast");
        };

        ws.onmessage = msg => {
            console.log(msg.data)
            expect(JSON.parse(msg.data).data).toEqual("test_broadcast");
            ws.close();
        };

        ws.onclose = () => done();

    });

    it("should heartbeat ping from server", async done => {

        const ws = new W3CWebSocket(`ws://localhost:${config.server.http_port}?token=${token}`);

        ws.onopen = async () => {
            await sockets.heartbeat();
        };

        ws.onmessage = msg => {
            console.log(msg.data)
            expect(msg.data).toEqual("ping");
            ws.close();
        };

        ws.onclose = () => done();

    });
});

// describe("Testing HTTP server", () => {
//     it("should get 404 on non existent key", async done => {
//         await request(server)
//             .get("/server?key=1&token=12345")
//             .expect(404);

//         done();
//     });



//     it("should get 200 on existent key", async done => {
//         const res = await request(server).get("/server?key=test&token=12345");

//         expect(res.statusCode).toEqual(200);
//         expect(JSON.parse(res.text)).toHaveProperty("error");
//         expect(JSON.parse(res.text)).toHaveProperty("message");

//         done();
//     });
// });



describe("Security tests", () => {

    it("should check the user is admin", async done => {

        expect(await security.user_is_admin(token));

        done();
    });

    it("should not authorize user with fake token", async done => {

        expect(await security.authorize("false token", "sys_login")).toBe(false);;

        done();
    });

    it("should return a sanitized url", done => {
        const urls = {
            "/server/../malware.js": "/malware.js",
            "/../..": "/"
        };

        Object.keys(urls).forEach(url => {
            expect(security.sanitize_path(url)).toEqual(urls[url]);
        });

        done();
    });


    it("should hash and compate pasword with hash", async done => {

        const password_hash = await security.password_hash("test_pasword");

        expect(await security.password_compare("test_pasword", password_hash));

        done();
    });

});