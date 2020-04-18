const MQTT = require('async-mqtt')
let instance = null

module.exports = class MqttConnector {
  constructor (user, psw) {
    if (!instance || (user && psw)) {
      instance = this

      this.config = {
        user: user || process.env.dbUser,
        password: psw || process.env.dbUserPassword,
        host: process.env.mqttAddress,
        port: process.env.mqttPort
      }

      this.client = MQTT.connect(`${this.config.host}:${this.config.port}`,
        { username: this.config.user, password: this.config.password })
    }
    return instance
  }
}
