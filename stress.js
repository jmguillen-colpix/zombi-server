'use strict'

const autocannon = require('autocannon');
const request = require("request-promise-native");

// const token = null;

// process.env.STRESS_LOGIN, process.env.STRESS_PASSWORD, "en"

(async () => {

    const url = `http://localhost:${process.env.ZOMBI_HTTP_PORT}`;

    const body = await request.post({
        url: `${url}/server`,
        json: true,
        headers: {
            "Content-type": "application/json; charset=utf-8"
        },
        body: {
            mod: "sys_login",
            fun: "login",
            args: [
                process.env.ZOMBI_TEST_LOGIN_USERNAME,
                process.env.ZOMBI_TEST_LOGIN_PASSWORD,
                process.env.ZOMBI_TEST_LOGIN_LANGUAGE
            ]
        }
    });
    
    // console.log(body);

    // const http_body = JSON.parse(body);

    const token = body.data.token;

    autocannon({
        url: url,
        connections: 100,
        duration: 10,
        headers: {
            'Content-type': 'application/json; charset=utf-8'
        },
        requests: [
            {
                method: 'POST',
                path: '/server',
                body: JSON.stringify({
                    token,
                    mod: "sys_tests",
                    fun: "test",
                    args: []
                })
            }
        ]
    }, (err, res) => {
        console.log('finished bench', err, res)
    });

})()



return true;




