const config = {

    node_name: process.env.ZOMBI_NODE_NAME || "JUNKRAT",

    schema: {
        locked: false,
        table_prefix: process.env.ZOMBI_DB_TABLE_PREFIX || "zombi_"
    },

    peers: {
        tserver: {
            user: "peer",
            pass: "peer",
            url:  "http://localhost:8888/server",
            sockets: true // If the peer also connects via sockets
        }
    },

    db: {
        default: {
            user: process.env.ZOMBI_DB_USER || "zombi",
            host: process.env.ZOMBI_DB_HOST || "localhost",
            port: process.env.ZOMBI_DB_PORT || 5432,
            pass: process.env.ZOMBI_DB_PASS || "SIBSadmin01",
            name: process.env.ZOMBI_DB_NAME || "zombi",
            type: process.env.ZOMBI_DB_TYPE || "postgresql", // oracle, mysql or postgresql
        },
        otra: {
            user: "zombi",
            host: "localhost",
            port: 1521,
            pass: "SIBSadmin01",
            name: "xepdb1",
            type: "oracle",
        },
        pg2: {
            user: "postgres",
            host: "192.168.10.46",
            port: 5432,
            pass: "P0stgr3sS",
            name: "chino_mock",
            type: "postgresql",
        },
        maria: {
            user: "zombi",
            host: "localhost",
            port: 3306,
            pass: "SIBSadmin01",
            name: "zombi",
            type: "mysql",
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
        token_size: 64 // Check the size of the column token on zombi_sessions table before changing this
    },

    server: {
        endpoint: "/server",
        public_directory:"/public",
        request_timeout: 60, // seconds 
        log: {
            console_enabled: true,
            file_enabled: true,
            file_name: "server.log",
            access_enabled: true,
            access_file_name: "access.log"
        },
        http_port: 8080
    },

    reactor: {
        interval: 60 // seconds
    },

    session: {
        expire: 600 // seconds
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
        reconnect_time: 2000
    }

};

module.exports = config;
