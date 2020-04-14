# HomeInOne

This project aims to give you full control over your home automation.
It's a node.js process that can run smoothly on a raspberry pi, but works on any other server.

Quick sumup of it's features:
- Control any of your devices connected to the system
- Manage new users, their access rights etc.
- Scheduling: tune your device to work on certain hours and certain days.
- Connects your iot devices over the restful API, the MQTT protocol, or directly using the gpio of your raspberry pi.
- Integrates Telegram bot. This means you don't need to open any ports to access your home from outside. HomeInOne will poll Telegram servers and watch for incoming requests. It's a one way comunication, nothing come in. 
- Integrates PiModule : [Pi-Module](https://pimodules.com/plus-advanced) is a very nice piece of electronic to add on top of your raspberry pi. It gives you another layer of security in case of electricity shortage with tons of other features. Don't hesitate to check out their website.

## Stack

It's pretty straight forward and classic architecture:
A node process connects to a postgres database and exposes its feature to a restful api.
On top of that, a MQTT broker and Telegram Bot. That's all.

To make thinks easier to set up, everything runs on docker and can be installed via Ansible.

Here is a sum up of the project architecture .
<p align="center">
    <img src="images/Project architecture.png" width="500" style="float:middle;">
</p>

## Installation

This porject fits perfectly a Raspberry Pi. To make it even more resiliant, HomeInOne can handle the [Pi-Module](https://pimodules.com/plus-advanced), which gives you another layer of security in case of electricity shortage. You can find instruction for its installation on [this repo](https://github.com/RomeHein/pimodule).

There is four ways to install HomeInOne:

### The user way (coming soon): 
Prerequisites: just your raspberry pi, with an SD card.

Install directly HomeInOne image on your raspberry pi. It's the last version of Raspbian with everything correctly set up inside. 

### The production way: Ansible
Prerequisites: 
- Raspbian installed on your raspberry
- SSH access to it
- Ansible installed on your dev machine

Once Ansible installed on your computer, clone the repo on your machine, and simply cd to the ansible directory of the project:
```cd /ansible```
Then all you have to do is run the following command in your terminal:
```ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook homeIn1.yml -i raspberrypi.local, --user=pi --ask-pass```
This command will install all the necessary tools on your raspberry pi. It will then reboot and run the HomeInOne process in a docker image.

You can also ask the playbook to install for you the PiModule:
```
ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook homeIn1.yml -i raspberrypi.local, --user=pi --ask-pass -e "pi_module=true"
```
And/or also transform your raspberry pi into an access point, in that case you should specify the wifi password of the raspberry pi wifi:
```
ANSIBLE_HOST_KEY_CHECKING=false ansible-playbook homeIn1.yml -i raspberrypi.local, --user=pi --ask-pass -e "access_point=true" "wifi_password=ChangeMe"
```

### The docker way:
Prerequisites: 
- Raspbian installed on your raspberry
- SSH access to it
- Docker and docker-compose installed on your raspberry pi
- Node.js installed on your raspberry pi

You may want to run docker images on your raspberry pi without running the ansible scripts.
In that case you can clone the repo wherever you want on your raspberry pi and then build the docker image manually from the project folder:
```
sudo docker build -t homeinone .
```
Then I strongly recommand using the docker-compose file present [here](ansible/roles/homeIn1/templates/docker-compose.yml.j2)
and replace all variables with the appropriate ones.
Once done you'll just have to run the command:
```
sudo docker-compose up -d
```

Note that once everything running, you can mannualy connect to the postgres db over docker via the following command:
```
psql postgres://hiouser:Homein1IsAnOpensourceDomoticProject4yourRP3@localhost:35432/hio
```

### The developer way.
Prerequisites: 
- Node.js installed on your dev machine
- A postgreSQL database running on your dev machine

You may also want to run the project on your local machine for dev purposes. This is possible, but keep in mind that you won't be able to use gpios (since I hope for you, you are not developing on a raspberry pi). 
You'll need a postgres database running and accessible.
You'll also need an `.env` file. You can use the one below and change the variables to fit your configuration: 

```
node_env=development
telegramToken= YourTelegramTokenHereFromBotFather
dbUser=hioUser
dbUserPassword=Homein1IsAnOpensourceDomoticProject4yourRP
db=hio
dbHost=localhost
dbPort=5432
dbSchema=home
apiAddress=http://localhost:7070/api/
apiPort=7070
mqttAddress=mqtt://localhost
mqttPort=1883
autoMigrate=true
systemName=BagheeHome
TZ=Europe/Amsterdam
```

Then install node packages:
```npm i```

And finally run the project:
`npm start`

When running for the first time, the project will initiate the db for you. But no actions nor users will be added.
You can do it manually with this sql exemple:
```
SET search_path TO home;
INSERT INTO "user" (user_id, user_role_id, user_telegram_id, user_telegram_name) VALUES (1, 1, 42424242, 'YourTelegramName');

-- Insert action linked to Raspberry pi gpio
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('Gpio linked device', 0, 1, 'onboard', '{"pin": 0, "onValue":1, "offValue": 0}', 'switch', 'Label for device', '1F512', '1F513');

-- Insert action linked to the API
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('water', 0, 1, 'api', '{"writeUrl":"http://192.168.50.174/digital/17/", "readUrl":"http://192.168.50.174/digital/17", "method": "GET", "onPayload":"1", "offPayload": "0", "readPayloadPath": "data.state", "onValue": 1, "offValue": 0}', 'switch', 'Water heater', '1F506', '1F319');

-- Insert action linked to MQTT
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('water', 0, 1, 'mqtt', '{"topic": "yourMqttTopic", "onValue":1, "offValue": 0}', 'switch', 'Water heater', '1F506', '1F319');

-- Insert action linked to the PiModule
INSERT INTO actionnable (action_id, action_state, action_mode, action_source, action_conf, action_type, action_title, action_on_icon, action_off_icon) VALUES ('alarmtrigger', 0, 1, 'pimodule', '{"method": "relay","onValue": 1, "offValue": 0}', 'switch', 'Trigger Alarm', '1F4E2', '1F4A4');

-- Insert a scheduling
INSERT INTO schedule (action_id, schedule_start_hour, schedule_end_hour,  schedule_days) VALUES ('water', '05:00', '08:00', ARRAY[0,1,2,3,4,5,6])
```

## API documentation

Api is available on localhost/doc once the process launched. You can have a look to the swagger definition in the api folder of the project.

## Authors

* **Romain Cayzac** - *Initial work*

## License

This project is licensed under the GNU GPLv3 License - see the [LICENSE.md](LICENSE.md) file for details
