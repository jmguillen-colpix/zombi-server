"use strict";

const config = require("./config");
const ssh = require("./ssh");

const fs = require('fs');

(async () => {

    try {

        const instance_public_dns_name = fs.readFileSync(`${__dirname}/server.name`).toString();

        const deploy_dir = `/home/${config.ssh.username}/zombi-server`;

        await ssh.connect({
            host: instance_public_dns_name,
            username: config.ssh.username,
            privateKey: config.ssh.key_file
        });

        await ssh.command(`rm -rf ${deploy_dir}`);
        await ssh.command(`mkdir -p ${deploy_dir}`);

        await ssh.putdir(`${__dirname}/../../server`, `${deploy_dir}/server`);
        await ssh.putfile(`${__dirname}/../../.env`, `${deploy_dir}/.env`);
        await ssh.putfile(`${__dirname}/../../ecosystem.config.js`, `${deploy_dir}/ecosystem.config.js`);
        await ssh.putfile(`${__dirname}/../../package-lock.json`, `${deploy_dir}/package-lock.json`);
        await ssh.putfile(`${__dirname}/../../package.json`, `${deploy_dir}/package.json`);
        await ssh.putfile(`${__dirname}/../docker/docker-app`, `${deploy_dir}/docker-app`);
        // await ssh.putfile(`${__dirname}/../docker/docker-compose.yml`, `${deploy_dir}/docker-compose-noenv.yml`);
        await ssh.putfile(`${__dirname}/../docker/docker-compose.yml`, `${deploy_dir}/docker-compose.yml`);

        // await ssh.command(`source .env; envsubst < "docker-compose-noenv.yml" > "docker-compose.yml";`, [], deploy_dir);

        

        await ssh.disconnect();

    } catch (error) { 
        console.log(error); 
        await ssh.disconnect();
    }

})();







