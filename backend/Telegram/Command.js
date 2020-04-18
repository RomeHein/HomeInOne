module.exports = class Command {
  constructor (message) {
    this.chatId = message.from.id
    this.userFullName = message.from.first_name + ' ' + message.from.last_name
    this.name = null
    this.messageId = null
    this.text = null
    this.accessRight = null
    let commands = null
    // If the command is a direct message from user
    if (message.text) {
      this.text = message.text
      commands = message.text.toLowerCase().replace('/', '').split('-')
    } else if (message.message) {
      commands = message.data.toLowerCase().split('-')
      this.messageId = message.message.message_id
      this.text = message.message.text
    }
    if (commands && commands.length > 0) {
      this.name = commands[0]
      this.arguments = commands.slice(1, commands.length)
    }
  }
}
