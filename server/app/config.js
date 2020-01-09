const config = {

    node_name: process.env.ZOMBI_NODE_NAME || "NATALIANATALIA",

    schema: {
        locked: false,
        table_prefix: process.env.ZOMBI_DB_TABLE_PREFIX || "zombi_"
    },

    db: {
        default: {
            user: process.env.ZOMBI_DB_USER || "zombi",
            host: process.env.ZOMBI_DB_HOST || "localhost",
            port: process.env.ZOMBI_DB_PORT || 5432,
            pass: process.env.ZOMBI_DB_PASS || "SIBSadmin01",
            name: process.env.ZOMBI_DB_NAME || "zombi",
            type: process.env.ZOMBI_DB_TYPE || "postgresql", // oracle, mysql or postgresql
            enabled: true
        },
        otra: {
            user: "zombi",
            host: "localhost",
            port: 1521,
            pass: "SIBSadmin01",
            name: "xepdb1",
            type: "oracle",
            enabled: false
        },
        pg2: {
            user: "postgres",
            host: "192.168.10.46",
            port: 5432,
            pass: "P0stgr3sS",
            name: "chino_mock",
            type: "postgresql",
            enabled: false
        },
        maria: {
            user: "zombi",
            host: "localhost",
            port: 3306,
            pass: "SIBSadmin01",
            name: "zombi",
            type: "mysql",
            enabled: false
        },
    },

    cache: {
        host: "localhost",
        port: 6379,
        prefix_user: "USERS:",
        prefix_sequence: "SEQUENCE",
        prefix_session: "SESSION:",
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
            headers: "content-type",
        }
    },

    server: {
        endpoint: "/server",
        public_directory:"/public",
        request_timeout: 60, // seconds 
        log: {
            log_info: true,
            log_error: true,
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
