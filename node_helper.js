/* Magic Mirror
 * Module: MMQT_COMMAND
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const exec = require("child_process").exec;
const mqtt = require("mqtt");

module.exports = NodeHelper.create({
	// Subclass start method.
	start: function() {
		var self = this;

		console.log("Starting helper for: " + self.name);
        this.config = false;
	},

    //
    //  Socket notifications -
    //      CONFIGURATION
    //
	socketNotificationReceived: function(notification, payload) {
        var self = this;
        console.log("MQTT Recieved: " + notification);
        if (notification === "MQTT_COMMAND_CONFIG" && !this.config) {
            console.log("Config applied");  
            this.config = true;
            this.config = payload;
            this.mqttClient = this.startupMQTT();
        }
    },
    
    //
    // COMMANDS
    //

    //
    //  Initialize MQTT - Switch HA-style
    //
    //      
    //
    //

    startupMQTT: function() {

        self = this;

        if (!this.config) {
            console.log("Error: no config, cannot startupMQTT");
            return
        }

        // Only handle one device at the moment
        self.deviceConfig = this.config.mqtt.devices[0];

        server = "mqtt://" + this.config.mqtt.server + ":" + this.config.mqtt.port;
        var client = mqtt.connect(server, {
            username: this.config.mqtt.username,
            password: this.config.mqtt.password,
            clientId:"MQTT_COMMAND" + Math.random().toString(16).substr(2, 8),
            keepalive:60,
            will: { topic: self.deviceConfig.availability_topic, payload: self.deviceConfig.payload_unavailable },
        });

        //
        //  OnConnect we need to subscribe to the COMMAND topic
        //  and tell the world we're alive and our status. 
        //  I.E
        //      public(availability_topic, online)
        //      
        //
        client.on("connect", function() {
            console.log("MQTT Connected");
            client.subscribe(self.deviceConfig.command_topic);
            client.publish(self.deviceConfig.availability_topic, self.deviceConfig.payload_available);
            self.publishState();

        });

        client.on("disconnect", function() {
            console.log("MQTT disConnected");
            client.publish(self.deviceConfig.avilability_topic, self.deviceConfig.payload_unavailable);
        });


        client.on('message', function (mqttTopic, message) {
            console.log('got mqtt message', mqttTopic, message.toString());
            if(mqttTopic == self.deviceConfig.command_topic) {
                // COMMAND
                console.log("COMMAND SET" + message);

                if(message == self.deviceConfig.payload_on) {
                    // TurnOn Screen
                    exec("tvservice --status",
                       function (error, stdout, stderr) {
                          //console.log(stdout);
                          if (stdout.indexOf("TV is off") !== -1) {
                            // Screen is OFF, turn it ON
                            exec("tvservice --preferred && sudo chvt 6 && sudo chvt 7", function(error, stdout, stderr){ 
                                self.publishState();
                            });
                          } else {
                            self.publishState();
                          }
                       });       
                    self.publishState();
                } else if (message == self.deviceConfig.payload_off) {
                    exec("tvservice --status",
                       function (error, stdout, stderr) {
                        //console.log(stdout);
                          if (stdout.indexOf("HDMI") !== -1) {
                            // Screen is ON, turn it OFF
                            exec("tvservice -o", function(error, stdout, stderr){ 
                                self.publishState();
                            });
                          } else {
                            self.publishState();
                          }

                        });
                }

            } else {
                console.log("Unknown command");
            }

        });

        client.on('error', function (error) {

            console.log('Error' + error);

        });
        return client;
    },

    publishState: function() {
        self = this;
        exec("tvservice --status",
            function (error, stdout, stderr) {
                if (stdout.indexOf("TV is off") !== -1) {
                    // Screen is OFF, turn it ON
                    self.mqttClient.publish(self.deviceConfig.state_topic, self.deviceConfig.payload_off);
                }
                else {
                    self.mqttClient.publish(self.deviceConfig.state_topic, self.deviceConfig.payload_on);
                }
            });              
    },


});
