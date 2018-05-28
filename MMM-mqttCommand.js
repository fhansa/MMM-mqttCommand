/* global Module */

/* Magic Mirror
 * Module: MMM-mqttCommand
 *
 * By Fredrik Hansson
 * MIT Licensed.
 */

Module.register("MMM-mqttCommand", {

	// Define module defaults
	defaults: {	
        mqtt: {

			// Server settings 
            server: "localhost",
            port: "xxx",
            username:"xxx",
			password:"pwd",

			// Device definitions - currently only supporting switch (HomeAssistant mqtt-switch)
			devices: [
				{ 
					type: "switch",					// Type of device 
					state_topic: "xx",				// mqtt topic for state
					payload_on:"on",				// Payload for On-state
					payload_off:"off",				// Payload for Off-state
					command_topic:"XX",				// mqtt topic to set the switch
					availability_topic:"XX",		// mqtt topic for availability
					payload_available:"online",		// Payload for avalable
					payload_unavailable:"offline",	// Payload for unavalable
				}
			]
        },

	},

	// 
	//	OnStart-method
	//
	start: function () {
		Log.log("Starting module: " + this.name);

        // Startup MQTT
        this.sendSocketNotification("MQTT_COMMAND_CONFIG", this.config);	
    },

	// 
	// onSocketNotification
	//		- Todo: enable debug information or other info to be presented on screen
	//
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
