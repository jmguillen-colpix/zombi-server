(() => {

    INDEX.i18n.apply();

    

    const generate_table = (data) => {

        let table_html = "<table class='table'>";

        for (const row of data) {

            table_html += "<tr><td style='text-align: left;'><a href='#' class='code_item_link' data-uid='" + row + "'>" + row + "</a></td></tr>";

        }
        
        table_html += "</table>";

        $("#code_table_container").html(table_html);

    };

    const load_data = () => {

        ZOMBI.server(
            ["sys_code", 
            "modules_list"],
            (error, results) => {

                if(error) { INDEX.flash(error); }

                else {

                    if(results.error) { INDEX.flash(results.message); }

                    else {

                        generate_table(results.data);

                    }

                }

            }

        );
        
    };

    $("body").off("click", ".code_item_link").on("click", ".code_item_link", function(event) {

        event.preventDefault();

        const uid = $(this).data("uid");

        ZOMBI.server(

            [ "sys_code", "module_code", uid ],

            (error, results) => {

                if(error) { INDEX.flash(error); }

                else {

                    if(results.error) { INDEX.flash(results.message); }

                    else {

                        $("#code_modal").find(".modal-title").html(uid);

                        $("#code_modal").modal();

                        // https://stackoverflow.com/a/47247404
                        $("#code_text").html(PR.prettyPrintOne(results.data));

                    }

                }

            }

        );

    });

    load_data();

    $("#code_refresh").on("click", event => {

        event.preventDefault();

        load_data();

    });

})()






