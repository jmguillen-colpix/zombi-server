"use strict";

const config = require("./config");
const ssh = require("./ssh");

const fs = require('fs');

(async () => {

    try {

        const instance_public_dns_name = fs.readFileSync(`${__dirname}/server.name`).toString();

        await ssh.connect({
            host: instance_public_dns_name,
            username: config.ssh.username,
            privateKey: config.ssh.key_file
        });

        // // OS
        // // await ssh.command('sudo yum -y update');
        // await ssh.command('sudo yum -y install rpm-build yum-utils wget net-tools gcc glibc curl gcc-c++ make tcl openssl openssl-devel pcre-devel');

        // // Node
        // await ssh.command('curl -sL https://rpm.nodesource.com/setup_12.x | sudo bash -');
        // await ssh.command('sudo yum -y install nodejs; node -v');

        // // Redis
        // await ssh.command('sudo yum -y install redis; sudo systemctl start redis; sudo systemctl enable redis; sudo systemctl status redis');

        // // PostgeSQL
        // await ssh.command('wget -P /tmp https://download.postgresql.org/pub/repos/yum/11/redhat/rhel-7.5-x86_64/pgdg-centos11-11-2.noarch.rpm');
        // await ssh.command('sudo yum -y install /tmp/pgdg-centos11-11-2.noarch.rpm');
        // await ssh.command('sudo yum -y install postgresql11 postgresql11-server postgresql11-contrib');
        // await ssh.command('export PGSETUP_INITDB_OPTIONS="--auth=md5"; sudo -E /usr/pgsql-11/bin/postgresql-11-setup initdb');
        // await ssh.command('sudo systemctl start postgresql-11; sudo systemctl enable postgresql-11; sudo systemctl status postgresql-11');

        // sudo -u postgres psql -c "CREATE USER xyz WITH PASSWORD 'xyz';" 

        // Docker
        await ssh.command('sudo yum install -y docker');
        await ssh.command('sudo systemctl enable docker');
        await ssh.command('sudo systemctl start docker');
        await ssh.command('sudo curl -L https://github.com/docker/compose/releases/download/1.25.1/docker-compose-Linux-x86_64 -o /usr/local/bin/docker-compose');
        await ssh.command('sudo chmod +x /usr/local/bin/docker-compose');
        await ssh.command('sudo usermod -aG docker ec2-user');
        await ssh.command('docker info');
        await ssh.command('docker-compose --version');

        await ssh.disconnect();

    } catch (error) { console.log(error); }

})();