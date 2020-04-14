require('dotenv').config()
const C = require('./model/Connector')
const ActionnableController = require('./Hardware/ActionnableController')

// Set globally the connector to make db request
global.Connector = new C()

const start = async (retried) => {
  if (process.env.autoMigrate && retried) {
    // Migrate DB up if new migrations are needed and available
    await Connector.migrateDB()
  }
  // Test the integrity of the db.
  try {
    await Connector.checkIntegrity()
    console.log('✅ DB checked')
    // Start hio API
    await require('./api')()
    console.log('✅ Server started')
    // Start hio MQTT
    await require('./mqtt')()
    console.log('✅ MQTT started')
    // Init actionnables
    await ActionnableController.initAll()
    console.log('✅ Init all actionnables')
    if (process.env.telegramToken) {
      // Load telegram bot
      await require('./Telegram')()
      console.log('✅ Telegram bot loaded')
    }
    if (process.env.piModule) {
      // Indicates everything ran swoothly
      require('./Hardware/Hardware').piModule.switchLed('green', 1)
    }
  } catch (err) {
    console.log(err.message)
    if (err.code) {
      // Handle
      if (retried) {
        console.log('⛔️ Could not init properly the DB')
        process.exit(1)
      } else {
        await Connector.initDB()
        await start(true)
      }
    }
  }
}

start()
