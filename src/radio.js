const config = require("./config");
const log    = require("./log");

var radio_stations = [];
var radio_device_counter = 0;

function turnon(station, func, listener = null) {

    if (!radio_stations[station]) { radio_stations[station] = []; }

    var radio_device_id = (++radio_device_counter).toString();

    if(_check_exists(station, "listener", listener)) {

        log(`The listner ${listener} is already listening to ${station}`, "radio/turnon");

    } else {

        radio_stations[station].push({

            radio_device_id: radio_device_id,

            func: func,

            listener: listener

        });

        const who_is_listening = (listener === null) ? radio_device_id : listener;

        log(`Receptor ${who_is_listening} is now listening to station ${station}`, "radio/turnon");

    }

    return radio_device_id;

};

function emit(station, music = null) {

    // const sequence = ZOMBI.sequence();

    if (!radio_stations[station]) {

        log(`Nobody is listening to station ${station}`, "radio/emit");

        return false;

    }

    setTimeout(function() {

        let subscribers = radio_stations[station],
            len = subscribers ? subscribers.length : 0;

        while (len--) {

            subscribers[len].func(music);

            const who_is_listening = (subscribers[len].listener === null) ? subscribers[len].radio_device_id : subscribers[len].listener;

            log(`Station ${station} is emiting the music ${music} to receptor ${who_is_listening}`, "radio/emit");

        }

    }, 0);

}

function turnoff(radio_device_id) {

    for (var m in radio_stations) {

        if (radio_stations[m]) {

            for (var i = 0, j = radio_stations[m].length; i < j; i++) {

                if (radio_stations[m][i].radio_device_id === radio_device_id) {

                    log(`Device ${radio_device_id} is not listening to station ${m} anymore`, "radio/turnoff");

                    radio_stations[m].splice(i, 1);

                    return radio_device_id;

                }

            }

        }

    }

}

function _check_exists(station2add, what, thing) {

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

}

module.exports = { turnon, turnoff, emit };