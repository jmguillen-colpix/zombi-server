const PORT_BASE = 8080;
const NODE_NAME_PREFIX = 'Z';

let s = 0;

const seq = ()  => { return s++; };
const pad = num => { return ("00" + num).slice(-2); };


const node_app_data = (name, port) => {

    const order = seq();

    return {
       name: `${NODE_NAME_PREFIX} ${pad(order)} ${name}`,
       script: 'src/app.js',
       args: '',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
           NODE_ENV: 'production',
           ZOMBI_HTTP_PORT: PORT_BASE + order,
           ZOMBI_NODE_NAME: name
       }

    }

}

module.exports = {
    apps: [
            node_app_data('ROADHOG'),
            node_app_data('PHARA'),
            node_app_data('MERCY'),
            node_app_data('SOLDIER'),
    ],

    deploy: {
        production: {
            user: 'node',
            host: '212.83.163.1',
            ref: 'origin/master',
            repo: 'git@github.com:repo.git',
            path: '/var/www/production',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }
};
