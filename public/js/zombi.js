const ZOMBI = (() => {

    var seq = 0;

    var radio_stations = [];
    var radio_device_counter = 0;

    var console_log_keep_data = [];

    var io_client = null;
    var io_callbacks = {};

    var state_data = {};

    return {

        log(message, context = "UNKNOWN") {

            const time = (new Date().toISOString().split("T")[1]).replace("Z", "");
            
            if(ZOMBI.config("CONSOLE_LOG_ENABLED")) { 
                
                console.log(`${time} ${context}: ${message}`); 
            
            }

            if(ZOMBI.config("CONSOLE_LOG_KEEP_ENABLED")) {

                console_log_keep_data.unshift([ZOMBI.sequence(), time, message, context]);

                if (console_log_keep_data.length > ZOMBI.config("CONSOLE_LOG_KEEP_MAX_SIZE")) { console_log_keep_data.pop(); }

            }
        
        },

        _get_log() {

            return console_log_keep_data;

        },

        sequence() { return seq++; },

        config(key) {
            
            if(zombiConfig.hasOwnProperty(key) && typeof zombiConfig[key] !== 'undefined') {
                
                return zombiConfig[key];
                
            } else { return null; }
                
        },

        token(token) {
            if(typeof token === "undefined") { return localStorage.getItem("zombi_token"); }
            else if(token === null) { localStorage.removeItem("zombi_token"); }
            else { localStorage.setItem("zombi_token", token); }
        },

        fullname(fullname) {
            if(typeof fullname === "undefined") { return localStorage.getItem("zombi_fullname"); }
            else if(fullname === null) { localStorage.removeItem("zombi_fullname"); }
            else { localStorage.setItem("zombi_fullname", fullname); }
        },

        timezone(tz) {
            if(typeof tz === "undefined") { return localStorage.getItem("zombi_timezone"); }
            else if(tz === null) { localStorage.removeItem("zombi_timezone"); }
            else { localStorage.setItem("zombi_timezone", tz); }
        },

        language(lang) {
            if(typeof lang === "undefined") { return localStorage.getItem("zombi_language"); }
            else if(lang === null) { localStorage.removeItem("zombi_language"); }
            else { localStorage.setItem("zombi_language", lang); }
        },

        state: {

            set(key, value) {

                let current_state = {};

                Object.assign(current_state, state_data); // We return the previous state below

                state_data[key] = value;

                ZOMBI.log(`State for key ${key} changed to ${JSON.stringify(value)}`, "STATE");

                ZOMBI.radio.emit("ZOMBI_STATE_CHANGE", { key, value, state_data });

                return current_state;

            },
 
            get(key) { if(state_data[key]) { return state_data[key]; } else { return null; } },

            data() { return state_data; },

            clear() { state_data = {}; ZOMBI.radio.emit("ZOMBI_STATE_CHANGE", { key: null, value: null, state_data }); }

        },

        io: {

            close() { io_client.close(); },

            connect(keep = true) {

                if(ZOMBI.config("SOCKETS_CONNECT_ENABLED")) {

                    const token = ZOMBI.token();

                    if(token === null) {
    
                        ZOMBI.log("Token not set, reconnecting later", "IO");
    
                        setTimeout(() => { ZOMBI.io.connect(); }, ZOMBI.config("SOCKETS_RECCONNECT_TIME"));
    
                    } else if (keep && io_client.readyState && io_client.readyState === 1) {

                        ZOMBI.log("Already connected to server", "IO");
    
                    } else {

                        const protocol = (location.protocol === "http:") ? "ws:" : "wss:" ;

                        const url = `${protocol}//${location.hostname}:${location.port}?token=${ZOMBI.token()}`;
    
                        ZOMBI.log("Connecting to " + url, "IO");
    
                        io_client = new WebSocket(url);
    
                        io_client.onopen = () => {

                            ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_CONNECTED");

                            ZOMBI.log("Connected", "IO");
                        
                        };

                        io_client.onclose = event => {

                            ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_DISCONNECTED");

                            const reconnect_time = ZOMBI.config("SOCKETS_RECCONNECT_TIME");
    
                            ZOMBI.log(`Socket is closed. Reconnect will be attempted in ${reconnect_time} milliseconds: ${event.reason}`, "IO");
    
                            setTimeout(() => { ZOMBI.io.connect(); }, reconnect_time);
                
                        };

                        io_client.onmessage = event => {

                            ZOMBI.log("Message: " + event.data, "IO");
    
                            if(event.data.substring(0, 4) === "ping") { // Server sent hertbeat ping

                                if (io_client && io_client.readyState && io_client.readyState === 1) {

                                    ZOMBI.log("Server sent ping, answering with pong", "IO");
    
                                    io_client.send("pong");

                                } else {

                                    ZOMBI.log("Cannot answer ping, not connected", "IO");

                                }

                            } else {

                                const data = JSON.parse(event.data);

                                ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_RECEIVE", data);
    
                                if(data.error && data.message) { // Message is a response to a user request because there is no context
            
                                    if(io_callbacks[data.info.sequence]) {

                                        io_callbacks[data.info.sequence](data);

                                        // TODO this is to prevent io_callbacks to leak. There may be a better solution...
                                        setTimeout(() => { delete io_callbacks[data.info.sequence]; }, 0);
                                    
                                    }
            
                                }
                                
                            }
    
                        };

                        io_client.onerror = event => {

                            ZOMBI.log("Connection error", "IO");
    
                        };

                    }

                } else {

                    ZOMBI.log("IO: Connection disabled on config", "IO");

                }

            },

            send(params, callback) {

                const base = {
                    token: ZOMBI.token(),
                    module: "",
                    function: "",
                    args: {},
                    config: {},
                    sequence: ZOMBI.sequence()
                };
    
                const smarap = (ZOMBI.utils.is_array(params)) ? {module: params[0], function: params[1], args: params[2]} : params; 
                
                const merged = ZOMBI.utils.extend(true, base, smarap);
    
                if(typeof callback === "function") { io_callbacks[sequence] = callback; }

                io_client.send(JSON.stringify(merged));

                ZOMBI.radio.emit("ZOMBI_SERVER_SOCKET_SEND", merged);
    
                return merged;
                
            }

        },

        server(params, callback) {

            if(typeof callback === "function") {

                return ZOMBI._exec(params, callback);

            } else {

                return new Promise((resolve, reject) => { 
                    
                    ZOMBI._exec(params, (err, res) => {

                        if(err) {

                            reject(err);

                        } else {

                            resolve(res);

                        }

                    });

                });

            }

        },
        
        _exec(params, callback) {

            const base = {
                token: ZOMBI.token(),
                module: "",
                function: "",
                args: {},
                config: {},
                sequence: ZOMBI.sequence()
            };

            const smarap = (ZOMBI.utils.is_array(params)) ? {module: params[0], function: params[1], args: params[2]} : params; 
            
            const merged = ZOMBI.utils.extend(true, base, smarap);

            ZOMBI.radio.emit("ZOMBI_SERVER_CALL_START", [merged.module, merged.function]);

            axios({
                method: 'post',
                url: `${ZOMBI.config("SERVER_PATH")}`,
                data: JSON.stringify(merged),
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: {'Content-Type': 'application/json'},
                validateStatus: (status) => { return true; } // Zombi doesn't care about HTTP codes that much
            }).then((response) => {

                if(
                    typeof response.data === "undefined" || 
                    typeof response.data.error === "undefined" ||
                    typeof response.data.info === "undefined" ||
                    typeof response.data.data === "undefined" ||
                    typeof response.data.message === "undefined"
                ) {

                    if(typeof callback === "function") { callback("Malformed server response", false); }

                } else {

                    if(response.data.info.expired) { // Session is expired

                        ZOMBI.radio.emit("ZOMBI_SERVER_SESSION_EXPIRED");
    
                    } else {
    
                        if(typeof callback === "function") { callback(null, response.data); }
    
                    }

                }

                ZOMBI.radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: response.data});

            }).catch((error) => {

                if (error.request) { // The request was made but no response was received. `error.request` is an instance of XMLHttpRequest

                    if(typeof callback === "function") { callback(`Server error: ${error.message}`, false); }

                    ZOMBI.radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: `Server error: ${error.message}`});

                } else { // Something happened in setting up the request that triggered an Error

                    if(typeof callback === "function") { callback(`Request error: ${error.message}`, false); }

                    ZOMBI.radio.emit("ZOMBI_SERVER_CALL_TRAFFIC", {sequence: merged.sequence, request: merged, response: `Request error: ${error.message}`});
                }
                
            }).then(() => { // This extra .then() works the same way as jquery's "always"
                
                ZOMBI.radio.emit("ZOMBI_SERVER_CALL_FINISH", [merged.module, merged.function]);

            });

            return merged;
            
        },

        radio: {

            turnon(station, func, listener = null) {

                if (!radio_stations[station]) { radio_stations[station] = []; }

                var radio_device_id = (++radio_device_counter).toString();

                if(ZOMBI.radio._check_exists(station, "listener", listener)) {

                    ZOMBI.log(`RADIO: The listner ${listener} is already listening to ${station}`);

                } else {

                    radio_stations[station].push({

                        radio_device_id: radio_device_id,
    
                        func: func,
    
                        listener: listener
    
                    });

                    const who_is_listening = (listener === null) ? radio_device_id : listener;

                    ZOMBI.log(`Receptor ${who_is_listening} is now listening to station ${station}`, "RADIO");

                }

                return radio_device_id;

            },

            emit(station, music = null) {

                const sequence = ZOMBI.sequence();

                if (!radio_stations[station]) {

                    ZOMBI.log(`Nobody is listening to station ${station}`, "RADIO");

                    return false;

                }

                setTimeout(function() {

                    let subscribers = radio_stations[station],
                        len = subscribers ? subscribers.length : 0;

                    while (len--) {

                        subscribers[len].func(music);

                        const who_is_listening = (subscribers[len].listener === null) ? subscribers[len].radio_device_id : subscribers[len].listener;

                        ZOMBI.log(`Station ${station} is emiting the music ${music} to receptor ${who_is_listening}`, "RADIO");

                    }

                }, 0);

            },

            turnoff(radio_device_id) {

                for (var m in radio_stations) {

                    if (radio_stations[m]) {

                        for (var i = 0, j = radio_stations[m].length; i < j; i++) {

                            if (radio_stations[m][i].radio_device_id === radio_device_id) {

                                ZOMBI.log(`Device ${radio_device_id} is not listening to station ${m} anymore`, "RADIO");

                                radio_stations[m].splice(i, 1);

                                return radio_device_id;

                            }

                        }

                    }

                }

            },

            _check_exists(station2add, what, thing) {

                let it_does = false;

                for (const station in radio_stations) {

                    if (radio_stations[station]) {

                        const j = radio_stations[station].length;

                        for (let i = 0; i < j; i++) {

                            if (station === station2add && radio_stations[station][i][what] === thing) {

                                it_does = true;

                            }

                        }

                    }

                }

                return it_does;

            },

        },

        utils: {

            extend () {

                // Variables
                var extended = {};
                var deep = false;
                var i = 0;
                var length = arguments.length;
            
                // Check if a deep merge
                if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
                    deep = arguments[0];
                    i++;
                }
            
                // Merge the object into the extended object
                var merge = function (obj) {
                    for ( var prop in obj ) {
                        if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                            // If deep merge and property is an object, merge properties
                            if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                                extended[prop] = ZOMBI.utils.extend( true, extended[prop], obj[prop] );
                            } else if(typeof obj[prop] !== "undefined") {
                                extended[prop] = obj[prop];
                            }
                        }
                    }
                };
            
                // Loop through each object and conduct a merge
                for ( ; i < length; i++ ) {
                    var obj = arguments[i];
                    merge(obj);
                }
            
                return extended;
            
            },

            is_empty(thing) {

                return (
                    typeof thing === "undefined" || 
                    thing === "" || 
                    thing === null || 
                    thing === "null" || 
                    thing === "false" || 
                    ( // Empty array
                        ZOMBI.utils.is_array(thing) &&
                        thing.length === 0
                    ) || 
                    thing === 0 ||
                    thing === "0" ||
                    ( // Empty object
                        typeof thing === "object" &&
                        Object.keys(thing).length === 0 &&
                        thing.constructor === Object
                    )
                );
            
            },
            
            is_array(thing) {
            
                return thing instanceof Array || Object.prototype.toString.call(thing) === '[object Array]';
            
            },
            
            is_object(thing) {
            
                return thing && typeof thing === 'object' && thing.constructor === Object;
            
            }

        },

    };

})();


/*
    Axios Response Schema
    {
        data: {}, // `data` is the response that was provided by the server
        status: 200, // `status` is the HTTP status code from the server response
        statusText: 'OK', // `statusText` is the HTTP status message from the server response
        headers: {}, //`headers` the headers that the server responded with. All header names are lower cased
        config: {}, // `config` is the config that was provided to `axios` for the request
        request: {} // `request` is the request that generated this response (XMLHttpRequest instance the browser)
    }
*/
