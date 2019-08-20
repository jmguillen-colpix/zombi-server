$(() => {

    INDEX.i18n.apply();

    INDEX.datatables.create(
        "sessions_table",
        "sys_sessions/sessions_table_data",
        [
            {
                "name": "user",
                className: 'dt-left',
                searchable: true,
                orderable: true
            },
            {
                "name": "message",
                className: 'dt-center',
                searchable: false,
                orderable: true,
                render: function (data, type, row, meta) {
                    return "<a href='#' class='sessions_table_message_link' data-token='" + data + "' data-uname='" + row[0] + "'><i class='fas fa-envelope'></i></a>";
                }
            },
            { 
                "name": "token", 
                searchable: true,
                render: function (data, type, row, meta) { // Inserts blaks so it can word break on the table
                    return data.match(/.{1,8}/g).join(" ");
                }
            },
            {
                "name": "data", 
                searchable: true,
                render: function (data, type, row, meta) { // See comment above
                    return data.replace(/","/g, '", "');
                } 
            },
            {
                "name": "created", 
                searchable: false,
                render: function (data, type, row, meta) {
                    return INDEX.i18n.utc2local(data);
                }
            },
            {
                "name": "updated", 
                searchable: false,
                render: function (data, type, row, meta) {
                    return INDEX.i18n.utc2timeago(data);
                }
            },
            {
                "name": "delete",
                className: 'dt-center',
                searchable: false,
                orderable: true,
                render: function (data, type, row, meta) {
                    return "<a href='#' class='sessions_table_delete_link' data-token='" + data + "'><i class='fas fa-times'></i></a>";
                }
            }
        ],
        "sessions_table_download",
        "sessions_table_refresh"
    );

    $('body').off("click", ".sessions_table_delete_link").on("click", ".sessions_table_delete_link", function(event) {

        event.preventDefault();

        const token = $(this).data("token");

        ZOMBI.server(
            ["sys_sessions", "session_delete", token],

            (error, response) => {

                if(error) { INDEX.flash(error); } 
                
                else {

                    if(response.error) { INDEX.flash(response.message); } 
                    
                    else { INDEX.datatables.refresh("sessions_table"); }
                
                }
            
            }

        );

    });

    $('body').off("click", ".sessions_table_message_link").on("click", ".sessions_table_message_link", function(event) {

        event.preventDefault();

        const token = $(this).data("token");
        const uname = $(this).data("uname");

        INDEX.data.set("sessions_message_token", token);
        INDEX.data.set("sessions_message_uname", uname);

        INDEX.load_modal("sessions_message");

    });

});
