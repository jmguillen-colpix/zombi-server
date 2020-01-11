const config  = require("../app/config");
const i18n    = require("../app/i18n");
const db      = require("../app/db/db");
const cache   = require("../app/cache");

const session   = require("../app/session");

/**
sys_tests/ping

This function returns "pong" as data to test if the server is responding

Arguments:
    None

Example:
    None

Returns:
    <string>pong

    On error returns the error message

*/
const ping = async (args, extras) => {

    return [false, null, "pong"];

};

/**
sys_tests/echo

This function returns the parameters passed as is

Arguments:
    None

Example:
    None

Returns:
    The arguments without modification or processing

*/
const echo = async (args, extras) => {

    try {

        return [false, args];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_tests/db_sequence

This function execute the generic database sequence and returns the next value. 

Arguments:
    None

Example:
    None

Returns:
    The next sequence value or error on error

*/
const db_sequence = async (args, extras) => {

    try {

        return [false, await db.sequence()];

    } catch(error) {

        return [true, null, error.message];

    }

};

/**
sys_tests/db_stress_test

This function truncates the table zombi_tests and inserts 
several rows at the same time to test the performance

Arguments:
    None

Example:
    None

Returns:
    "OPERATION_SUCCEEDED" on success or the error message on error

*/
const db_stress_test = async (args, extras) => {

    const promesas = [];

    let sql = "truncate table zombi_tests";

    db.sql(
        sql,
        [],
        (err, reply) => {

            if(err) { callback({error: err}); }
            else {

                for (let i = 0; i < 1000; i++) {

                    promesas.push(new Promise((resolve, reject) => {
            
                        sql = `insert into ${db.table_prefix()}tests (id, text, number) values (nextval('zombi_seq'), :b, :c)`;
            
                        db.sql(
                            sql,
                            ["T", 99],
                            (err, reply) => {
            
                                if(err) { reject(err); }
                                else { resolve("ok"); }
            
                            }
            
                        );
            
                    }));
            
                }

                Promise.all(promesas).then((messages) => {
            
                    callback({error:false, message: await i18n.label(extras.token, "OPERATION_SUCCEEDED")});
        
                }).catch((errors) => {
        
                    callback({error:true, data: errors});
        
                });

            }

        }

    );

};

/* 

Joi.array().items() accepts another Joi schema to use against the array elements. So an array of strings is this easy:

Joi.array().items(Joi.string())
Same for an array of objects; just pass an object schema to items():

Joi.array().items(Joi.object({
    // Object schema
}))
*/
const test = async (args, extras) => {

    try {


        const x = await session.tokens(0);

        return [false, x];

    } catch(error) {

        return [true, null, error.message];

    }

    //send_message = (token, context = "none", data = [])

}

module.exports = { test, ping, echo, db_sequence, db_stress_test }