const config  = require("./src/config");

// const db  = require("./src/db/db");

var log  = require("./src/log");


const fs = require("fs");
const path = require("path");

const argv = require('minimist')(process.argv.slice(2));

console.log(JSON.stringify(argv));



const run = async () => {

    try {

        const subject = argv._.shift();
        const action  = argv._.shift();

        switch (subject) {

            case "crud":

                switch (action) {

                    case "create":

                        if(argv.table && argv.module) {

                            log(`Creating CRUD for table "${argv.table}" on module "${argv.module}"`, "brains/crud/create");

                            const source_file = path.join("src/skel/crud.js");
                            const dest_file   = path.join("server/face", path.basename(path.basename(argv.module, ".js")) + ".js");
                            
                            const crud_data = fs.readFileSync(source_file);

                            const metadata = await db.metadata("zombi_users");

                            let crud_select = "select\n";

                            const pad = "                           ";

                            metadata.rows.forEach(row => {

                                crud_select += (pad + row[1]).slice(-pad.length) + ",\n"
                                
                            });

                            console.log(crud_data.toString().replace("ssss", crud_select));

                            exit();
                        
                        } else {

                            log(`Missing table and/or module name`, "brains/crud/create", true);

                        }
                        
                        break;
                
                    default:

                            log(`Table action "${action}" doesn't work for Brains`, "brains/crud/create", true);

                        break;

                }
                
                break;

            case "module":

                switch (action) {

                    case "create":

                        if(argv.name) {

                            log(`Creating module "${argv.name}"`, "brains/module/create");

                            const source_file = path.join("src/skel/module.js");
                            const dest_file   = path.join("server/face", path.basename(path.basename(argv.name, ".js")) + ".js"); 

                            if (fs.existsSync(dest_file)) {

                                log(`Module already exists`, "brains/module/create", true);

                            } else {

                                log(`Copying ${source_file} to ${dest_file}`, "brains/module/create");

                                fs.copyFileSync(source_file, dest_file);

                            }
                        
                        } else {

                            log(`Missing module name`, "brains/module/create", true);

                        }
                        
                        break;
                
                    default:

                            log(`Action "${action}" doesn't work for Brains`, "brains/module/create", true);

                        break;
                }
                
                break;

            case "view":

                switch (action) {

                    case "create":

                        if(argv.name) {

                            log(`Creating view "${argv.name}"`, "brains/view/create");

                            const source_file_js   = path.join("src/skel/view.js");
                            const source_file_html = path.join("src/skel/view.html");
                            const dest_file_js     = path.join("public/views", argv.name + ".js");
                            const dest_file_html   = path.join("public/views", argv.name + ".html"); 

                            if (fs.existsSync(dest_file_js) || fs.existsSync(dest_file_html)) {

                                log(`View already exists`, "brains/view/create", true);

                            } else {

                                log(`Copying ${source_file_js}, ${source_file_html} to ${dest_file_js}, ${dest_file_html}`, "brains/view/create");

                                fs.copyFileSync(source_file_js, dest_file_js);
                                fs.copyFileSync(source_file_html, dest_file_html);

                            }
                        
                        } else {

                            log(`Missing view name`, "brains/view/create", true);

                        }
                        
                        break;
                
                    default:

                        log(`Action "${action}" doesn't work for Brains`, "brains/view/create", true);

                        break;
                }
                
                break;

            case "schema":

                switch (action) {

                    case "create":

                        const schema = require("./src/db/schema");

                        if(argv.prefix) {

                            await schema.create(argv.prefix);

                        } else {

                            await schema.create();

                        }

                        exit(0);

                        break;
                
                    default:

                        log(`Action "${action}" doesn't work for Brains`, "brains/schema/create", true);

                        break;
                }
                
                break;

            default:

                log(`Subject "${subject}" doesn't work for Brains`, "brains/subject", true);

                break;
        }

    } catch (error) {
                
        log(error.message, "brains", true);

        exit(1);

    }

}

function show_usage() {

    console.log(`Usage:`);
    console.log(`\nnode brains <subject> <action> [modifiers]`);
    console.log(`\nExamples:`);
    console.log(`\nnode brains module create --name=mymodule`);
    console.log(`node brains module delete --name=mymodule`);

}

function exit(code = 0) {

    log("shutdown");
    setTimeout(() => { process.exit(code); }, 300);

}

if (argv._.length < 2) {
    
    show_usage();

} else { run(); }