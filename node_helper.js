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

    notificationCallback(message) {
        return;
    }

    //
    //  mqtt state publish. 
    //      Implement logic to determine state here and publish accordingly. 
    //      Leave empty if state is not possible to implement. 
    //      In that case set optimistic to true in HomeAssistant
    //
    publishState(checkInitialState = false) {
        return;
    }

    //
    //  mqtt availability publish. 
    //      Base class is mostly sufficient. 
    //      It will publish avaliable when command is starting up and unavailable when shutting down.
    //      This message is also used as mqtt last will   
    //
    publishAvailability(isAvailable) {
        if(this.client.deviceConfig.availability_topic) {
            if(isAvailable)
                this.client.publish(this.client.deviceConfig.availability_topic, this.client.deviceConfig.payload_available, { "retain": true } );   
            else
                this.client.publish(this.client.deviceConfig.availability_topic, this.client.deviceConfig.payload_available, { "retain": true } );   
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


/*
    mqttCommandNotification
        
        Command class for routing notifications from MQTT to sendNotification
*/
class mqttCommandNotification extends mqttCommand {
    publishState(checkInitialState = false) {
        // Notification cannot publish state
        return;
    }

    executeCommand(message) {
        this.node_helper.sendSocketNotification("NOTIFICATION", message.toString());
    }
}

/*
    mqttCommandHideShow

        Implementation of command class for hiding and showing modules

*/
class mqttCommandHideShow extends mqttCommand {

	publishState(checkInitialState = false) {
        self = this;
        if(checkInitialState) {
            self.node_helper.sendSocketNotification("HIDE_SHOW", { module:self.client.deviceConfig.module,   command:"check"});
            return;
        }
        if (!this.client.deviceConfig.state_topic) 
            return;
        if(this.state)
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_on);
        else    
            // deviceConfig should contain module identifier
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_off);
    }

    executeCommand(message) {
        self = this;
        if(message == self.client.deviceConfig.payload_on) {
            // Show module
            self.node_helper.sendSocketNotification("HIDE_SHOW", { module:self.client.deviceConfig.module, show:true, command:"set" });
        } else if (message == self.client.deviceConfig.payload_off) {
            self.node_helper.sendSocketNotification("HIDE_SHOW", { module:self.client.deviceConfig.module, show:false, command:"set" });
        }
    }

    notificationCallback(message) {
        this.state = message.show;
        self.publishState();
        return;
    }
}

/*
    mqttCommandMonitor

        Implementation of command class for turning monitor on and off

*/
class mqttCommandMonitor extends mqttCommand {

	publishState(checkInitialState = false) {
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

/*
    mqttCommandTest
        Mqtt test command. 
        Command simulates a on/off device.

*/
class mqttCommandTest extends mqttCommand {
    constructor(client, node_helper) {
        super(client, node_helper);
        this.state = "on";
    }

	publishState(checkInitialState = false) {
        self = this;
        if (!this.client.deviceConfig.state_topic) 
            return;
        if(this.state === "off") {
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_off, { "retain": true });
        }
        else {
            self.client.publish(self.client.deviceConfig.state_topic, self.client.deviceConfig.payload_on, { "retain": true });
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
        this.observers = [];
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
        } else if(notification === "HIDE_SHOW_RESULT") {
            //console.log("HIDE_SHOW_RESULT", payload);
            var obs = this.observers[payload.module];
            if(obs)
                obs.notificationCallback(payload);
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

        // 
        //  Set up all defined devices
        //
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

            // Determine command-class - kind of factory
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
                case "native_modulevisibility":
                    client.command = new mqttCommandHideShow(client, self);
                    self.observers[client.deviceConfig.module] = client.command;
                break;
            }

            //
            //  OnConnect - we need to subscribe to the COMMAND topic
            //  if an availability topic is defined then publish that
            //
            client.on("connect", function() {
                console.log("MQTT Connected");
                
                //Subscribe to COMMAND
                var cmd = client.deviceConfig.command_topic;
                var birth = client.deviceConfig.brokerBirthTopic;
                client.subscribe(
                        { cmd : 0,  
                          birth : 0 });
                
                // Publish availability if that is defined
                client.command.publishAvailability(true);
                
                // Publish state if that is defined
                client.command.publishState(true);
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

                if(mqttTpoic == client.deviceConfig.brokerBirthTopic) {
                    console.log("Got birth message");
                    client.command.publishAvailability(true);
                }

                // Failsafe - check topic (even though we only subscribe to one)
                if(mqttTopic == client.deviceConfig.command_topic) {
                    // COMMAND
                    console.log("COMMAND SET" + mqttTopic + message);
                    client.command.executeCommand(message.toString());
                }
            });

            client.on('error', function (error) {
                console.log('Error' + error);
            });    
        })
    },

});
