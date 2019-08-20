const config  = require("./config");

const chalk  = require('chalk');
const path   = require('path');
const fs     = require('fs');

// Log file open
const log_file_path = path.join(__dirname, "../storage/logs/" + config.server.log.file_name);

var log_file_desc = false;

fs.open(log_file_path, 'a', function(err, fd) {

    if (err) {

        log_console("Error opening: [" + log_file_path + "] " + err, "server/log_file_open", true);
    
    } else {

        log_console("Log file: [" + log_file_path + "] opened.", "server/log_file_open");

        log_file_desc = fd;

    } 

});

const log_console = (message, context = "unknown", error = false) => {

    const d = new Date();

    const t = d.toISOString();

    const m = t + " [" + context + "] " + message;

    const badge = (error) ? chalk.red("ERROR ") : chalk.green("INFO  ");

    console.log(badge + m);

};

const log_file = (message, context, error = false) => {

    const d = new Date();

    const t = d.toISOString();

    const m = t + " [" + context + "] " + message;

    const badge = (error) ? "ERROR " : "INFO  ";

    let buffer = Buffer.from(badge + m + "\n");

    if (log_file_desc) {

        fs.write(log_file_desc, buffer, 0, buffer.length, null, (err) => {

            if (err) { log_console("Error writing log file", "server/log_file_write", true); }

        });

    }

};

const log = (message, context, error = false) => {

    if(message === "shutdown") {

        try {

            fs.close(log_file_desc, () => {
    
                log_file_desc = false;
        
                log("Log file closed", "log/log_file_close");

                if(typeof context === "function") { context(null, true); }
        
            });
    
        } catch(error) {
    
            log(error.message, "log/log_file_close");

            if(typeof context === "function") { context(error.message, false); }
    
        }

    } else {

        if(config.server.log.console_enabled) { log_console(message, context, error); }

        if(config.server.log.file_enabled && log_file_desc) { log_file(message, context, error); }

    }
 
};

module.exports = log;