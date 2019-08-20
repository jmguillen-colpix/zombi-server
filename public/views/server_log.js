(() => {

    INDEX.i18n.apply();

    const load_data = () => {

        ZOMBI.server(
            ["sys_admin", 
            "get_server_log"],
            (error, results) => {

                if(error) { INDEX.flash(error); }

                else {

                    if(results.error) { INDEX.flash(results.message); }

                    else {

                        // $("#server_log_data").innerHTML(results.data);

                        document.getElementById("server_log_data").innerHTML = results.data;

                    }

                }

            }

        );
        
    };

    load_data();

    $("#server_log_refresh").on("click", event => {

        event.preventDefault();

        load_data();

    });

})()






