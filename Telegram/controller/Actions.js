const api = require('../apis').telegram
const hioApi = require('../apis').hio

module.exports = class Actions {
  static async handle (command) {
    if (command.arguments && command.arguments.length > 0 && command.arguments[0] !== 'reload') {
      return Actions.handleSwitch(command)
    } else {
      return Actions.menu(command)
    }
  }

  static async handleSwitch (command) {
    let url = 'actionnable/switch/' + command.arguments[0]
    if (command.arguments[1]) {
      url += '/' + command.arguments[1]
    }
    const switchData = await hioApi.get(url)
    if (switchData.type !== 'impulse') {
      return Actions.menu(command)
    }
  }

  static async menu (command) {
    const actionsData = await hioApi.get('actionnables')
    let markup = {
      inline_keyboard: actionsData.reduce((previous, switchData) => {
        if (switchData.mode === 1 && switchData.type !== 'relay') {
          let icon = null
          let shouldSchedule = null
          if (switchData.state === -1) {
            // Means the action is currently in schedule mode
            icon = '1F550'
          } else {
            icon = (switchData.state ? switchData.onIcon : switchData.offIcon)
            shouldSchedule = !switchData.state && switchData.schedules && switchData.schedules.constructor === Array && switchData.schedules.length
          }
          let button = {
            text: String.fromCodePoint(parseInt(icon, 16)) + ' ' + switchData.title,
            callback_data: command.name + '-' + switchData.id
          }
          if (shouldSchedule) {
            button.callback_data += '-schedule'
          }
          let previousButtonRow = previous[previous.length - 1]
          if (previousButtonRow.length > 1 || (previousButtonRow[0] && previousButtonRow[0].callback_data === 'switchcontroller')) {
            previous.push([button])
          } else {
            previousButtonRow.push(button)
          }
        }
        return previous
      }, [[]])
    }
    markup.inline_keyboard.push([{
      text: '\u{1F504}',
      callback_data: command.name + '-reload'
    }, {
      text: 'Close',
      callback_data: 'close'
    }])
    const options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify(markup)
    }
    if (command.messageId) {
      return api.editMessageText('Control Actions', options)
    } else {
      return api.sendMessage(command.chatId, 'Control Actions', options)
    }
  }
}
