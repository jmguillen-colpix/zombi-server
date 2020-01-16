const config = {

    node_name: process.env.ZOMBI_NODE_NAME || "NOBODY",

    schema: {
        locked: false,
        table_prefix: process.env.ZOMBI_DB_TABLE_PREFIX || "zombi_"
    },

    db: {
        default: {
            user: process.env.ZOMBI_DB_USER || "the_user",
            host: process.env.ZOMBI_DB_HOST || "the_host",
            port: process.env.ZOMBI_DB_PORT || 5432,
            pass: process.env.ZOMBI_DB_PASS || "the_password",
            name: process.env.ZOMBI_DB_NAME || "the_db_user",
            type: process.env.ZOMBI_DB_TYPE || "postgresql", // oracle, mysql or postgresql
            enabled: true
        },
        other_db: {
            user: process.env.ZOMBI_DB_USER_1 || "the_user",
            host: process.env.ZOMBI_DB_HOST_1 || "the_host",
            port: process.env.ZOMBI_DB_PORT_1 || 1521,
            pass: process.env.ZOMBI_DB_PASS_1 || "the_password",
            name: process.env.ZOMBI_DB_NAME_1 || "the_db_user",
            type: process.env.ZOMBI_DB_TYPE_1 || "oracle",
            enabled: false
        }
    },

    cache: {
        host: "localhost",
        port: 6379
    },

    i18n: {
        lang: "es",
        timezone: "America/Argentina/Buenos_Aires"
    },

    security: {
        salt_rounds: 10,
        token_size: 64, // <= size of the column token on sessions table
        cors: {
            origin: "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            headers: "content-type"
        }
    },

    server: {
        endpoint: "/server",
        public_directory: "/home/jmg/zombi-client", // If starts with / it is absolute path
        request_timeout: 60, // seconds
        log: {
            log_info: true,
            log_error: true
        },
        http_port: process.env.ZOMBI_HTTP_PORT || 8080
    },

    reactor: {
        interval: 60 // seconds
    },

    session: {
        cache_prefix: "ZOMBI_SESSION:",
        expire: 60 // seconds
    },

    inst: {
        save_cpu_data: true,
        save_disk_data: true,
        save_mem_data: true,
        save_cpu_skip: 1,
        save_disk_skip: 60,
        save_mem_skip: 10
    },

    sockets: {
        ping_response_time_limit: 2000, // milliseconds
        reconnect_time: 2000 // milliseconds
    }

};

module.exports = config;
