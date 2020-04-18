const api = require('../apis').telegram
const hioApi = require('../apis').hio

module.exports = class Users {
  static async find (userTelegramId) {
    return hioApi.get('user/telegram/' + userTelegramId)
  }

  static async handle (command) {
    if (command.arguments && command.arguments.length > 0) {
      switch (command.arguments[0]) {
        case 'info':
          return this.userInfo(command, command.arguments[1])
        case 'block':
          return this.editUserStatus(command, command.arguments[1], 3)
        case 'unblock':
          return this.editUserStatus(command, command.arguments[1], 1)
        case 'delete':
          return this.editUserStatus(command, command.arguments[1], 4)
        case 'accept':
          return this.editUserStatus(command, command.arguments[1], 1)
        case 'refuse':
          return this.editUserStatus(command, command.arguments[1], 4, `Sorry, your demand to join ${process.env.systemName} has been denied. Please contact the administrator directly or try again.`)
      }
    } else {
      switch (command.name) {
        case 'admins':
          return this.showUsers(command, 1)
        case 'guests':
          return this.showUsers(command, 2, [1, 3])
        case 'pendingguests':
          return this.showUsers(command, 2, [2])
      }
    }
  }

  static async showUsers (command, accessRights, status) {
    const users = (await hioApi.get('users', { accessRights })).filter(user => (status && status.constructor === Array && status.indexOf(user.status.id) > -1) || !status)
    let markup = {
      inline_keyboard: users.reduce((previous, user) => {
        const buttonInfo = {
          text: user.telegramName,
          callback_data: command.name + '-info-' + user.id
        }
        if (command.accessRight === 1 && user.role.id !== 1) {
          let text = '\u{2705}'
          let data = ''
          switch (user.status.id) {
            case 1:
              text = '\u{1F6AB}'
              data = '-block-'
              break
            case 2:
              data = '-accept-'
              break
            case 3:
              data = '-unblock-'
              break
          }
          const buttonBlock = {
            text: text,
            callback_data: command.name + data + user.id
          }
          const buttonDelete = {
            text: '\u{274C}',
            callback_data: command.name + '-delete-' + user.id
          }
          previous.push([buttonInfo, buttonBlock, buttonDelete])
        } else {
          let previousButtonRow = previous[previous.length - 1]
          if (previousButtonRow.length > 1) {
            previous.push([buttonInfo])
          } else {
            previousButtonRow.push(buttonInfo)
          }
        }
        return previous
      }, [[]])
    }
    markup.inline_keyboard.push([{
      text: '\u{2B05} back',
      callback_data: 'back-' + command.name
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

  static async userInfo (command, userId) {
    const user = await hioApi.get('user/' + userId)
    let inlineKeyboard = []
    if (command.accessRight === 1 && user.role.id !== 1) {
      let text = '\u{2705}'
      let data = ''
      switch (user.status.id) {
        case 1:
          text = '\u{1F6AB}'
          data = '-block-'
          break
        case 2:
          data = '-accept-'
          break
        case 3:
          data = '-unblock-'
          break
      }
      inlineKeyboard.push([{
        text,
        callback_data: command.name + data + user.id
      }, {
        text: '\u{274C}',
        callback_data: command.name + '-delete-' + user.id
      }])
    } else if (user.role.id === 1) {
      // Give guest possibilities to contact admins
      inlineKeyboard.push([{
        text: 'Contact',
        callback_data: command.name + '-contact-' + user.id
      }])
    }
    inlineKeyboard.push([{
      text: '\u{2B05} back',
      callback_data: 'back-' + command.name
    }, {
      text: 'Close',
      callback_data: 'close'
    }])

    const options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify({ inline_keyboard: inlineKeyboard })
    }
    let message = 'User name: ' + (user.name || user.telegramName)
    if (user.role.label) {
      message += '\nAccess rights: ' + user.role.label
    }
    if (user.status.label) {
      message += '\nStatus: ' + user.status.label
    }
    if (user.startDateAccess && user.endDateAccess) {
      message += '\nAccess granted from ' + user.startDateAccess + ' to ' + user.endDateAccess
    }
    if (command.messageId) {
      return api.editMessageText(message, options)
    } else {
      return api.sendMessage(command.chatId, message, options)
    }
  }

  static async editUserStatus (command, userId, statusId, customMessage) {
    const user = await hioApi.get(`user/${userId}/status/${statusId}`)
    command.arguments = null
    let message = ''
    switch (statusId) {
      case 1:
        message = `Your access to ${process.env.systemName} has been granted. You can now control the door and all other commands! Start a message with '/' to see all available commands ;)`
        break
      case 3:
        message = `Your access to ${process.env.systemName} has been blocked. If it seems like a mistake, please contact the administrators.`
        break
      case 4:
        message = `Access to ${process.env.systemName} has been revoked. If it's a mistake, please contact the administrators.`
        break
    }
    api.sendMessage(user.telegramId, customMessage || message)
    return Users.handle(command)
  }

  static async newUser (command) {
    let newUser = {
      telegramId: command.chatId,
      telegramName: command.userFullName,
      role: { id: 2 },
      status: { id: 2 }
    }
    try {
      newUser = await hioApi.post('user', newUser)
    } catch (err) {
      console.log('Error when saving new user: ' + err)
      return api.sendMessage(command.chatId, 'Seems like you are already register...')
    }
    const admins = await hioApi.get('users', { accessRights: 1 })
    // TODO: Send request to all admins... Yes indeed concurrent choices could happen here. The last admin to reply will be right :/
    admins.forEach(admin => {
      api.sendMessage(admin.telegramId, `${command.userFullName} has made a request to join ${process.env.systemName} as a guest.\nAre you ok with that? Don't worry, once accepted, you'll be able to manage its permissions.`, {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{
              text: 'Yes',
              callback_data: `guests-accept-${newUser.id}` // We volontary set 'guests' as command, so that once admins has made their choice, it will display the guest list
            }, {
              text: 'No',
              callback_data: `guests-refuse-${newUser.id}`
            }],
            [{
              text: `I'll decide later in the manage user menu`,
              callback_data: `close`
            }]
          ]
        })
      })
    })
    return api.sendMessage(command.chatId, "Your query has been sent to my father. I'll notify you when you are in.")
  }
}
