(async () => {

    INDEX.i18n.apply();

    try {

        // ZOMBI.state.set("foo", "bar");

        // const data = await ZOMBI.server(["sys_login", "login", ["inewton", "pelotas"]]);

        // if(data.error) { INDEX.flash(data.message); }

        // else { INDEX.flash(data.data.token); }

        // console.log(data);
        
    } catch (error) {

        INDEX.flash(error.message);

        console.log(error);
        
    }
    

    

})();
