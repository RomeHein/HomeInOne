const telegram = require('./apis').telegram
const rooter = require('./Rooter')

module.exports = async () => {
  function handleError (err, type) {
    console.log(`⚠️ TELEGRAM BOT ${type || ''}ERROR \nDate: ` + new Date().toISOString() + '\nError: ' + err)
  }

  telegram.on('error', err => handleError(err, 'UNCAUGHT '))
  telegram.on('polling_error', err => handleError(err, 'POLLING '))
  telegram.on('callback_query', async function (message) {
    try {
      await rooter.handle(message, 'INTERNAL')
    } catch (err) {
      handleError(err)
    }
    try {
      // Notify telegram handled the bot the event
      await telegram.answerCallbackQuery(message.id)
    } catch (err) {
      handleError(err)
    }
  })
  telegram.on('message', async function (message) {
    try {
      await rooter.handle(message, 'INTERNAL')
    } catch (err) {
      handleError(err)
    }
  })
}
