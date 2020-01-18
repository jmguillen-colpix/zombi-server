'use strict'

const autocannon = require('autocannon');

const url = `http://localhost:${process.env.ZOMBI_HTTP_PORT}`;

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
                module: "sys_login",
                function: "login",
                args: [process.env.STRESS_LOGIN, process.env.STRESS_PASSWORD, "en"]
            })
        }
    ]
}, finishedBench)

function finishedBench(err, res) {
    console.log('finished bench', err, res)
}
