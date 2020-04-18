const telegramApi = require('./apis').telegram
const Command = require('./Command')
const camera = require('./controller/Camera')
const actions = require('./controller/Actions')
const schedule = require('./controller/Schedule')
const Users = require('./controller/Users')

let mainCommands = {
  addpendingguest: {
    accessRight: 1,
    action: async command => Users.addPendingGuest(command)
  },
  refusependingguest: {
    accessRight: 1,
    action: async command => Users.refusePendingGuest(command)
  },
  start: {
    accessRight: 3,
    action: async command => Users.newUser(command)
  },
  close: {
    accessRight: 2,
    action: async command => telegramApi.deleteMessage(command.chatId, command.messageId)
  }
}

let menu = {
  name: 'cmd',
  title: 'Main menu',
  submenu: {
    botstatus: {
      name: 'botstatus',
      title: 'Status',
      width: 0.5,
      action: (command) => {
        let options = {
          chat_id: command.chatId,
          message_id: command.messageId,
          reply_markup: ''
        }
        const date = new Date()
        if (command.messageId) {
          return telegramApi.editMessageText('All good!\nIt\'s ' + date, options)
        } else {
          return telegramApi.sendMessage(command.chatId, 'All good!\nIt\'s ' + date, options)
        }
      }
    },
    settings: {
      name: 'settings',
      title: 'Settings',
      width: 0.5,
      submenu: {
        manageusers: {
          name: 'manageusers',
          title: 'Manage users',
          accessRight: 1,
          width: 0.5,
          submenu: {
            admins: {
              name: 'admins',
              title: 'Admins',
              width: 1,
              action: (command) => Users.handle(command)
            },
            guests: {
              name: 'guest',
              title: 'Guests',
              width: 0.5,
              action: (command) => Users.handle(command)
            },
            pendingguests: {
              name: 'pendingguests',
              title: 'Pending guests',
              width: 0.5,
              action: (command) => Users.handle(command)
            }
          }
        },
        schedule: {
          name: 'schedule',
          width: 0.5,
          title: 'Schedule',
          action: command => schedule.handle(command)
        },
        scenes: {
          name: 'scenes',
          width: 0.5,
          title: 'Scenes'
        }
      }
    },
    camera: {
      name: 'camera',
      title: 'Camera',
      width: 0.3,
      action: command => camera.handle(command)
    },
    actions: {
      name: 'actions',
      title: 'Actions',
      width: 0.3,
      action: command => actions.handle(command)
    }
  }
}

module.exports = class Rooter {
  static async handle (message) {
    // Parse the incoming telegram message
    let command = new Command(message)

    // Add to the command object, user rights
    const user = await Users.find(command.chatId)
    if (user && user.role && user.status.id === 1) {
      command.accessRight = user.role.id
    } else {
      command.accessRight = 3 // Forbidden
    }

    // Check if we have to deal with a main command
    let mainCommand = mainCommands[command.name]
    if (mainCommand && command.accessRight <= mainCommand.accessRight) {
      return mainCommand.action(command)
    }

    // Handle restricted access rights
    if (!command.accessRight || command.accessRight === 3) {
      console.log(command.userFullName + ':Tried to acces to system!')
      return telegramApi.sendMessage(command.chatId, `You are not authorized to ask me anything yet! sorry, ask my father ;)`)
    }

    let submenu = null
    // If a back button is press, find the previous menu in the menu tree. The command first argument should contain the current menu
    if (command.name === 'back') {
      submenu = Rooter.find(command.arguments[0], menu, true)
      command.name = submenu.name
      command.arguments = null
    // If the command is the main command, just reply the general menu
    } else if (command.name === 'cmd') {
      return Rooter.replyWithMenu(menu.submenu, command)
    // Else find the right menu in the menu tree
    } else {
      submenu = Rooter.find(command.name, menu)
    }
    // Once we have found the right menu, generate the message or handle the action
    if (submenu && submenu.submenu) {
      return Rooter.replyWithMenu(submenu.submenu, command)
    } else if (submenu && submenu.action) {
      return submenu.action(command)
    }

    // Could not find a matching command
    telegramApi.sendMessage(command.chatId, `Sorry, don't know that command...`)
    throw new Error('Could not handle command: ' + command)
  }

  /**
   * Find and return the menu object
   * @param {String} menuName The menu name to look for
   * @param {Object} submenu The submenu item where to look for
   * @param {Boolean} parent Set true if the function should return the parent of the asked menu
   */
  static find (menuName, submenu, parent) {
    if (submenu.submenu) {
      if (submenu.submenu[menuName]) {
        if (parent) {
          return submenu
        }
        return submenu.submenu[menuName]
      } else {
        for (let menu of Object.values(submenu.submenu)) {
          let match = Rooter.find(menuName, menu, parent)
          if (match) {
            return match
          }
        }
      }
    }
    return null
  }

  /**
   * Generate a telegram response for a given menu and command
   * @param {String} menu 
   * @param {String} command 
   */
  static async replyWithMenu (menu, command) {
    let rowWidth = 0
    let markup = {
      inline_keyboard: Object.entries(menu).reduce((previous, kv) => {
        // If no width, this means we want to hide the button
        if (kv[1].width) {
          let button = {
            text: kv[1].title,
            callback_data: kv[0]
          }
          // If width is > 1 we want a new row
          if (rowWidth + kv[1].width > 1) {
            // Only add the button if access rights
            if (!kv[1].accessRight || command.accessRight <= kv[1].accessRight) {
              previous.push([button])
            }
            rowWidth = kv[1].width
          } else {
            if (!kv[1].accessRight || command.accessRight <= kv[1].accessRight) {
              previous[previous.length - 1].push(button)
            }
            rowWidth += kv[1].width
          }
        }
        return previous
      }, [[]])
    }
    // Add close or back button
    markup.inline_keyboard.push([
      {
        text: command.messageId && command.name !== 'cmd' ? '\u{2B05} back' : '\u{2716} close',
        callback_data: command.messageId && command.name !== 'cmd' ? 'back-' + command.name : 'close'
      }
    ])
    let options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify(markup)
    }
    if (command.messageId) {
      return telegramApi.editMessageText('Pick an action', options)
    } else {
      return telegramApi.sendMessage(command.chatId, 'Control Actions', options)
    }
  }
}
