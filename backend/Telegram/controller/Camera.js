const api = require('../apis').telegram
const hioApi = require('../apis').hio
const camera = require('../../Hardware/Hardware').camera

module.exports = class Camera {
  static async handle (command) {
    if (command.arguments && command.arguments.length > 0) {
      switch (command.arguments[0]) {
        case 'picture':
          return Camera.snap(command)
      }
    } else if (command.name === 'knockknock') {
      return Camera.knockknock()
    } else {
      return Camera.menu(command)
    }
  }

  static async menu (command) {
    let markup = {
      inline_keyboard: [
        [{
          text: 'Take picture',
          callback_data: command.name + `-picture`
        }],
        [{
          text: 'Close',
          callback_data: `close`
        }]
      ]
    }
    const options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify(markup)
    }
    if (command.messageId) {
      return api.editMessageText('Control camera', options)
    } else {
      return api.sendMessage(command.chatId, 'Control camera', options)
    }
  }

  static async knockknock () {
    await camera.snap()
    let users = await hioApi.get('users')
    const path = require('path')
    const appDir = path.dirname(require.main.filename)
    const promises = users.map(user => {
      return api.sendPhoto(user.telegramId, path.join(appDir, 'Hardware/intercom.jpg'), { caption: 'Someone rang at the door!' })
    })
    return Promise.all(promises)
  }

  static async snap (command) {
    await camera.snap()
    return api.sendPhoto(command.chatId, `../Hardware/intercom.jpg`, { caption: 'Camera live' })
  }
}
