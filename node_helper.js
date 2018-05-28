/* Magic Mirror
 * Module: MMM-mqttCommand
 *
 * By Fredrik Hansson
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const exec = require("child_process").exec;
const mqtt = require("mqtt");
/*
    All:
        - name
        - server
        - host
        - command_type          = native, notification
        - command_topic

        * username
        * password

        * availability_topic    
        * payload_available     = online
        * payload_unavailable   = offline
        * state_topic

    Switch:
        * payload_on            = on
        * payload_off           = off
        * native_command
        * notification          = NOTIFICATION, payload_on/payload_off

*/

/*
    BaseClass for mqttCommands

    Three methods are overridable:
        publishState()
        publishAvailability()
        executeCommand()

*/
class mqttCommand {
    //
    //  Keep reference to mqttClient and node_helper
    //
    constructor(client, node_helper) {
        console.log("mqttCommand base");
        this.client = client;
        this.node_helper = node_helper;
    }

    //
    //  mqtt state publish. 
    //      Implement logic to determine state here and publish accordingly. 
    //      Leave empty if state is not possible to implement. 
    //      In that case set optimistic to true in HomeAssistant
    //
    publishState() {
        return;
    }

    //
    //  mqtt availability publish. 
    //      Base class is mostly sufficient. 
    //      It will publish avaliable when command is starting up and unavailable when shutting down.
    //      This message is also used as mqtt last will   
    //
    publishAvailability(isAvailable) {
        console.log("mqttCommand-publishAvailability");
        if(this.client.deviceConfig.availability_topic) {
            if(isAvailable)
                this.client.publish(this.client.deviceConfig.availability_topic, this.client.deviceConfig.payload_available);   
            else
                this.client.publish(this.client.deviceConfig.availability_topic, this.client.deviceConfig.payload_available);   
        }
    }

    //
    //  mqtt command publish. 
    //      Implement any logic to handle the command.
    //      Good practise is to publish state when the command has executed successfully
    //
    executeCommand(msg) {
        return;
    }
}

class mqttCommandNotification extends mqttCommand {
    publishState() {
        // Notification cannot publish state
        return;
    }

    executeCommand(message) {
        this.node_helper.sendSocketNotification("NOTIFICATION", message.toString());
    }
}

class mqttCommandMonitor extends mqttCommand {

	publishState() {
        self = this;
        if (!this.client.deviceConfig.state_topic) 
            return;
        exec("tvservice --status",
        function (error, stdout, stderr) {
            if (stdout.indexOf("TV is off") !== -1) {
                // Screen is OFF, turn it ON
                self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_off);
            }
            else {
                self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_on);
            }
        });   
    }

    executeCommand(message) {
        self = this;
        if(message == self.client.deviceConfig.payload_on) {
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
        } else if (message == self.client.deviceConfig.payload_off) {
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
    }
}

class mqttCommandTest extends mqttCommand {
    constructor(client, node_helper) {
        super(client, node_helper);
        this.state = "on";
    }

	publishState() {
        self = this;
        if (!this.client.deviceConfig.state_topic) 
            return;
        if(this.state === "off") {
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_off);
        }
        else {
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_on);
        }
    }

    executeCommand(msg) {
        console.log("mqttCommantTest - executeCommand");
        console.log(msg);
        self = this;
        if(msg === self.client.deviceConfig.payload_on) {
            this.state = "on";
            self.publishState();
        } else if (msg === self.client.deviceConfig.payload_off) {
            this.state = "off";
            self.publishState();
        }
    }
}



module.exports = NodeHelper.create({

    //
    // onStart
    //
	start: function() {
		var self = this;

		console.log("Starting helper for: " + self.name);
        this.config = false;
        this.mqttClient = false;
        this.clients = [];
        this.idx = 0;
	},

    //
    //  Socket notifications -
    //      CONFIGURATION
    //
	socketNotificationReceived: function(notification, payload) {
        var self = this;
        console.log("MQTT Recieved: " + notification);
        if (notification === "MQTT_COMMAND_CONFIG" && !this.config) {
            //console.log("Config applied");  
            this.config = true;
            this.config = payload;
            this.startupMQTT();
        }
    },
    

    //
    // COMMANDS
    //

    //
    //  Initialize MQTT - Switch HA-style
    //
    //
    startupMQTT: function() {

        self = this;

        if (!this.config) {
            console.log("Error: no config, cannot startupMQTT");
            return
        }
        // Only handle one device at the moment
        this.config.devices.forEach(function(config) {

            //
            //  Create client for this device
            //
            server = "mqtt://" + config.server + ":" + config.port;
            var client = mqtt.connect(server, {
                username: config.username,
                password: config.password,
                clientId:"MQTT_COMMAND" + Math.random().toString(16).substr(2, 8),
                keepalive:60,
                will: { topic: config.availability_topic, payload: config.payload_unavailable },
            });
            self.clients[self.idx++] = client;

            // Store device configuration on client
            client.deviceConfig = config;

            // Determine command-class
            switch(client.deviceConfig.command_type) {
                case "notification" :
                    client.command = new mqttCommandNotification(client, self);
                break;
                case "native_monitor":
                    client.command = new mqttCommandMonitor(client, self);
                break;
                case "test":
                    client.command = new mqttCommandTest(client, self);
                break;
            }

            //
            //  OnConnect - we need to subscribe to the COMMAND topic
            //  if an availability topic is defined then publish that
            //
            client.on("connect", function() {
                console.log("MQTT Connected");
                
                //Subscribe to COMMAND
                client.subscribe(client.deviceConfig.command_topic);
                
                // Publish availability if that is defined
                client.command.publishAvailability(true);
                
                // Publish state if that is defined
                client.command.publishState(client);
            });

            //
            //  onDisconnect - send unavailable if that is defined
            //
            client.on("disconnect", function() {
                console.log("MQTT disconnected");
                client.command.publishAvailability(false);
            });

            //
            //  onMessage - the command
            //
            client.on('message', function (mqttTopic, message) {
                console.log('got mqtt message', mqttTopic, message.toString());

                // Failsafe - check topic (even though we only subscribe to one)
                if(mqttTopic == client.deviceConfig.command_topic) {
                    // COMMAND
                    console.log("COMMAND SET" + message);
                    client.command.executeCommand(message.toString());
                }
            });

            client.on('error', function (error) {
                console.log('Error' + error);
            });    
        })
    },

});
