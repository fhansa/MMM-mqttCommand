# MMM-mqttCommand
MQTT Command broker - trigger various command in Magic Mirror using MQTT 
Special focus on exposing commands/functions in MagicMirror to be used in HomeAssistant as mqtt-devices and to use them in HomeKit (either via HomeAssistant or Homekit2MQTT) 

## Status
* This project is in pilot phase

## Features
* Native command to control Monitor
* Route notification to sendNotification to open up usage of other modules (however state is not supported)
* Possible to expose many functions as individual devices.

## Future ideas
* implement HAP nodejs to support HomeKit directly (probably another module)
* implement commands for 
  * carousel navigation using [MMM-Carousel](https://github.com/shbatm/MMM-Carousel)
  * [MMM-Remote-Control](https://github.com/Jopyth/MMM-Remote-Control) with state 
  * Generic notification to enable other modules to publish state making all modules with notification support available to homekit.
  * show/hide module using 
  * displaying sensors

## Getting Started

In order to get it running you must have a mqtt broker installed. To enable full use of this component HomeAssistant, Homekit2MQTT or other home automation software is recommended. 


### Prerequisites

Any MQTT-broker. 

HomeAssistant with homekit-component or homekit2mqtt if devices should be used in HomeKit. 
* [HomeAssistant](https://www.home-assistant.io/) 
* [HomeAssistant - Homekit](https://www.home-assistant.io/components/homekit/)
* [Mosquitto mqtt-broker](https://mosquitto.org/)

Alternative way to publish devices to HomeKit:
* [Homekit2MQTT](https://www.npmjs.com/package/homekit2mqtt)


### Installing

Install in MagicMirror by cloning the repository into ../modules. 
```
cd MagicMirror/modules
git clone https://github.com/fhansa/MMM-mqttCommand.git
cd MMM-mqttCommand
npm install
```

Configuration for test-command. 
Test-command just response to mqtt-commands qithout avtually doing anything. 
```
{
  module: "MMM-mqttCommand",
  position: "top_right",
  config: {
    devices:[
    {
      server: "mqtt-server",
      port: "1883",        
      username: "username",
      password: "password",
      type: "switch",
      command_type: "test",
      state_topic: "home/mirror/test",
      payload_on:"on",
      payload_off:"off",
      command_topic:"home/mirror/test/set",
      availability_topic:"home/mirror/test/available",
      payload_available:"online",
      payload_unavailable:"offline",
    }
  ]
}
```
### MQTT
Mqtt device reference:
* [HomeAssistant MQTT-switch](https://www.home-assistant.io/components/switch.mqtt/)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details


  
