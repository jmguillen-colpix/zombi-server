const config = require("../../config");
const log    = require("../../log");
const stats  = require("../../stats");

/* 
create database if not exists zombi;
create user zombi identified by 'SIBSadmin01';
grant all privileges on zombi.* to zombi;
*/

const mysql = require('mysql');

const clients = {};

// TODO this is incomplete, add more data type codes here
const get_data_type = (code) => {

    if(
        code === 10 ||
        code === 7 
    ) {

        return "DATE";

    } else if(
        code === 3   ||
        code === 246
    ) {

        return "NUMERIC";

    } else {

        return "STRING";

    }

}

const connect = async (db_name, callback) => {

    try {

        if(typeof clients[db_name] === "undefined") {

            clients[db_name] = mysql.createConnection({
                host     : config.db[db_name].host,
                port     : config.db[db_name].port,
                user     : config.db[db_name].user,
                password : config.db[db_name].pass,
                database : config.db[db_name].name
              });

        }

        clients[db_name].connect((err) => {

            if(err) { 
                log(err, "mysql/connect", true);
                if(typeof callback === "function") { callback(err, false); }

            } else {
                log("Connected to " + db_name + " mysql@" + config.db[db_name].host + ":" + config.db[db_name].port + "/" + config.db[db_name].name, "mysql/connect");
                if(typeof callback === "function") { callback(null, true); }

            }

        });

        clients[db_name].on('error', (error) => {

            log(error.message, "mysql/connect", true);
            
            setTimeout(() => { connect(db_name); }, 1000);

        }); 

    } catch (err) { log(err.message, "mysql/connect", true); }

}


const sql = (sql, bind, callback, db_name) => {

    let reply = {info: {db_name: db_name, db_type: config.db[db_name].type, rows: 0, fields: []}, rows: null };

    // This is to use Oracle style bindvars, meaning colon prefixed words as bind variables on the SQL text
    // so this transforms a SQL text like "where id = :id" to "where id = ?"
    let mysql_sql = sql.replace(/:\S*\w/g, function(x) { 
        return "?";
    });

    clients[db_name].query({
        sql: mysql_sql
      },
      bind,
      (error, results, fields) => {

            if(error) {

                stats.rup();

                if(typeof callback === "function") { callback(err.message, false); }
    
                log(mysql_sql, "mysql/sql", true);
                log(err.message, "mysql/sql", true);

            } else {

                stats.dup();
                
                if(typeof callback === "function") {

                    if(fields) {

                        reply.info.rows = results.length;

                        fields.forEach(field => {
    
                            reply.info.fields.push({name: field.name, type: get_data_type(field.type)});
                            
                        });
    
                        reply.rows = results;

                    } else {

                        reply.info.rows = results.affectedRows;

                    }

                    callback(null, reply); 

                }

            }

        }

    );

}

const shutdown = (db_name) => {
    
  try {

        log("Shutting down MySQL connections", "mysql/shutdown");

        clients[db_name].end(function(err) {
            if(err) { log(err, "mysql/shutdown", true); }
        });

    } catch(err) { log(err.message, "mysql/shutdown", true); }

}

module.exports = { connect, shutdown, sql }


/*
TODO
Example of transactions: 

const { Pool } = require('pg')
const pool = new Pool()

(async () => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const { rows } = await client.query('INSERT INTO users(name) VALUES($1) RETURNING id', ['brianc'])

    const insertPhotoText = 'INSERT INTO photos(user_id, photo_url) VALUES ($1, $2)'
    const insertPhotoValues = [res.rows[0].id, 's3.bucket.foo']
    await client.query(insertPhotoText, insertPhotoValues)
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})().catch(e => console.error(e.stack))
*/

