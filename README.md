# MMM-mqttCommand
MQTT Command broker - trigger various command in Magic Mirror using MQTT 
Special focus on exposing commands/functions in MagicMirror to be used in HomeAssistant as mqtt-devices and to use them in HomeKit (either via HomeAssistant or Homekit2MQTT) 

## Status
* This project is in pilot phase

## Features
* Native command to control Monitor
* Route notification to sendNotification to open up usage of other modules (however state is not supported)
* Possible to expose many functions as individual devices.


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

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc

  
