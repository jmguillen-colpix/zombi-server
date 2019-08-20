$(() => {

    INDEX.i18n.apply();

    const server_status_call = () => {

        ZOMBI.server(
            ["sys_stats", "server_status_data"],
            (err, res) => {
                if(err) { INDEX.flash(err); }
                else {
                    if(res.error) { INDEX.flash(res.message); }
                    else {
                        $("#server_status_server_cpu").html(res.data[1] + "%");
                        $("#server_status_server_memory").html(Math.round(parseInt(res.data[2][0])/1024/1024) + "MB");
                        $("#server_status_server_name").html(res.data[3]);
                        $("#server_status_server_platform").html(res.data[4]);
                        $("#server_status_server_release").html(res.data[5]);
                        $("#server_status_server_response").html(res.data[7].tav + "/" + res.data[7].tmi + "/" + res.data[7].tma);
                    }
                }
            }
        );

    };

    server_status_call();

});