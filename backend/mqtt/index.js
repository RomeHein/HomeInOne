const aedes = require('aedes')()
const server = require('net').createServer(aedes.handle)
const port = process.env.mqttPort || 1883
const sql = require('../model/sql')

// This is the MQTT broker
// Note: For now the mqtt broket is sensible to man in the middle attacks. An SSL implementation is required to address that issue.
// Although, it's not a critical issue as devices should be connected on a trusted local network (via wifi). 

module.exports = async () => {
  server.listen(port)

  if (process.env.node_env === 'development') {
    aedes.on('clientError', (client, err) => {
      console.log('❌ client error', client.id, err.message)
    })
    aedes.on('connectionError', (client, err) => {
      console.log('❌ client error', client, err.message)
    })
    aedes.on('publish', (packet, client) => {
      if (client) {
        console.log('✉️ message from client', client.id)
      }
    })
    aedes.on('subscribe', (subscriptions, client) => {
      if (client) {
        console.log('❤️ subscribe from client', subscriptions, client.id)
      }
    })
    aedes.on('client', client => {
      console.log('new client', client.id)
    })
  }

  // Filter clients with access rights
  aedes.authenticate = async (client, username, password, callback) => {
    const preferences = await Connector.db.tx(t => t.one(sql.preference.find))
    const isServer = (username === process.env.dbUser && password.toString() === process.env.dbUserPassword)
    const isExternalAuthorizedDevice = (preferences && username === preferences.system_devices_access_name && password.toString() === preferences.system_devices_access_password)
    callback(null, isServer || isExternalAuthorizedDevice)
  }
}
