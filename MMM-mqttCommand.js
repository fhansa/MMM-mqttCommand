/* global Module */

/* Magic Mirror
 * Module: Calendar
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("MMM-mqttCommand", {

	// Define module defaults
	defaults: {	
        mqtt: {
            server: "localhost",
            port: "xxx",
            username:"xxx",
			password:"pwd",
			devices: [
				{ 
					type: "switch",
					state_topic: "xx",
					payload_on:"on",
					payload_off:"off",
					command_topic:"XX",
					availability_topic:"XX",
					payload_available:"online",
					payload_unavailable:"offline",
				}
			]
        },

	},

	// Define required scripts.
	getStyles: function () {
		return false;
	},

	// Define required scripts.
	getScripts: function () {
		return false;
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Override start method.
	start: function () {
		Log.log("Starting module: " + this.name);

        // Startup MQTT
        this.sendSocketNotification("MQTT_COMMAND_CONFIG", this.config);	
    },

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		this.updateDom(this.config.animationSpeed);
	},

	// Override dom generator.
	getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = "MQTT_COMMAND";
        return wrapper;
    }
});
