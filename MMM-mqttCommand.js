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
		// Device definitions - currently only supporting switch (HomeAssistant mqtt-switch)
		devices: [
			{ 
				// Server settings 
				server: "localhost",
				port: "1883",
				username:"",
				password:"",
				command_type: "test",
				name: "Monitor On/Off",
				type: "switch",					// Type of device 
				state_topic: "xx",				// mqtt topic for state
				payload_on:"on",				// Payload for On-state
				payload_off:"off",				// Payload for Off-state
				command_topic:"XX",				// mqtt topic to set the switch
				availability_topic:"XX",		// mqtt topic for availability
				payload_available:"online",		// Payload for avalable
				payload_unavailable:"offline",	// Payload for unavalable
				brokerBirthTopic : "home/ha/availability"
			}
		]
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
		self = this;
		console.log(notification, payload);
		if(notification == "NOTIFICATION") {
			msg = JSON.parse(payload);
			this.sendNotification(msg.notification, msg.payload);
		} else if (notification === "HIDE_SHOW") {
			msg = payload;
			MM.getModules().enumerate(function(mod) {
				if (mod.name === msg.module) {
					if(msg.command == "check") {
						self.notifyModuleStatus(mod.name, !mod.hidden);
					} else 
					if (mod.hidden === msg.show) {
						if(mod.hidden) {
							mod.show(500, function() {
								self.notifyModuleStatus(mod.name, true);
							});
						} else {
							mod.hide(500, function() {
								self.notifyModuleStatus(mod.name, false);
							});
						}
					} 
				}
			});
		}
	},

	notifyModuleStatus:function(name, flag) {
		this.sendSocketNotification("HIDE_SHOW_RESULT", { module: name, show : flag });
	},

	// Override dom generator.
	getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = "MQTT_COMMAND";
        return wrapper;
    }
});
