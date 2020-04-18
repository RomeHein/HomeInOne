const api = require('../apis').telegram
const hioApi = require('../apis').hio

module.exports = class Schedule {
  static async handle (command) {
    if (command.arguments && command.arguments.length === 1) {
      return Schedule.show(command)
    } else if (command.arguments && (command.arguments.length === 2 || command.arguments.length === 3)) {
      if (command.arguments[2] === 'delete') {
        return Schedule.delete(command)
      }
      return Schedule.setDays(command)
    } else if (command.arguments && command.arguments.length === 5) {
      return Schedule.setHours(command)
    } else if (command.arguments && command.arguments.length === 6) {
      return Schedule.save(command)
    } else {
      return Schedule.pickActionToSchedule(command)
    }
  }

  static async save (command) {
    const schedule = {
      id: command.arguments[1],
      actionId: command.arguments[0],
      days: command.arguments[2].split(',').map(string => parseInt(string)),
      startTime: command.arguments[3],
      endTime: command.arguments[4]
    }
    if (command.arguments[1] === 'new') {
      await hioApi.post('schedule', schedule)
    } else {
      await hioApi.put('schedule', schedule)
    }
    return Schedule.pickActionToSchedule(command)
  }

  static async delete (command) {
    if (command.arguments[1] && command.arguments[1] !== 'new') {
      await hioApi.delete('schedule/' + command.arguments[1])
    }
    return Schedule.show(command)
  }

  static async show (command) {
    const switchData = await hioApi.get('actionnable/' + command.arguments[0])
    if (switchData) {
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thirsday', 'friday', 'saturday']

      let markup = {
        inline_keyboard: []
      }
      let message = 'No schedules for this actions'
      if (switchData.schedules) {
        message = switchData.schedules
          .reduce((previous, schedule, currentIndex) => {
            const selectedWeekDays = weekDays.slice().filter((_, index) => schedule.days.indexOf(index) > -1)
            previous.push(currentIndex + 1 + '- ' + selectedWeekDays.join(', ') + '\n' + schedule.startHour + ' -> ' + schedule.endHour)
            return previous
          }, [[]])
          .join('\n')
        message += '\n\nSelect the schedule number you wish to edit:'
        markup.inline_keyboard = switchData.schedules.reduce((previous, schedule, currentIndex) => {
          let selectButton = {
            text: currentIndex + 1,
            callback_data: command.name + '-' + switchData.id + '-' + schedule.id
          }
          let deleteButton = {
            text: '\u274C',
            callback_data: command.name + '-' + switchData.id + '-' + schedule.id + '-delete'
          }
          previous.push([selectButton, deleteButton])
          return previous
        }, [])
      }

      markup.inline_keyboard.push([{
        text: '\u{2B05} back',
        callback_data: 'back-' + command.name
      }, {
        text: 'new',
        callback_data: command.name + '-' + switchData.id + '-new'
      }])
      const options = {
        chat_id: command.chatId,
        message_id: command.messageId,
        reply_markup: JSON.stringify(markup)
      }
      return api.editMessageText(message, options)
    }
  }

  static async setDays (command) {
    const switchData = await hioApi.get('actionnable/' + command.arguments[0])
    let schedule = {}
    if (command.arguments[1] && command.arguments[1] !== 'new') {
      schedule = switchData.schedules.find(schedule => schedule.id === parseInt(command.arguments[1]))
    }
    if (switchData) {
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      let selectedDays = []
      if (command.arguments[2]) {
        selectedDays = command.arguments[2].split(',').map(dayStringNumber => parseInt(dayStringNumber))
      } else if (schedule && schedule.days) {
        selectedDays = schedule.days
      }
      let markup = {
        inline_keyboard: weekDays.reduce((previous, weekDay, currentIndex) => {
          const dayIsAlreadySelected = (selectedDays.indexOf(currentIndex) > -1)
          let args = selectedDays.slice()
          if (dayIsAlreadySelected) {
            args = args.filter(day => day !== currentIndex)
          } else {
            args.push(currentIndex)
          }
          let button = {
            text: (dayIsAlreadySelected ? '\u{2705} ' : '') + weekDay.substring(0, 2),
            callback_data: command.name + '-' + switchData.id + '-' + (schedule.id || 'new') + '-' + args.join(',')
          }
          let previousButtonRow = previous[previous.length - 1]
          if (previousButtonRow.length > 3) {
            previous.push([button])
          } else {
            previousButtonRow.push(button)
          }
          return previous
        }, [[]])
      }

      if (selectedDays.length) {
        markup.inline_keyboard.push([{
          text: '\u{2B05} back',
          callback_data: 'back-' + command.name
        }, {
          text: '\u{27A1} next',
          callback_data: command.name + '-' + switchData.id + '-' + (schedule.id || 'new') + '-' + selectedDays.join(',') + '-' + (schedule.startHour || '06:00') + '-' + (schedule.endHour || '18:00')
        }])
      } else {
        markup.inline_keyboard.push([{
          text: '\u{2B05} back',
          callback_data: 'back-' + command.name
        }])
      }
      const options = {
        chat_id: command.chatId,
        message_id: command.messageId,
        reply_markup: JSON.stringify(markup)
      }
      return api.editMessageText('Select days:', options)
    }
  }

  static async setHours (command) {
    const previousCommandArguments = command.name + '-' + command.arguments.slice(0, 3).join('-') + '-'
    let startTime = command.arguments[3].split(':')
    let endTime = command.arguments[4].split(':')
    let nextStartHour = parseInt(startTime[0]) + 1
    if (nextStartHour < 10) {
      nextStartHour = `0${nextStartHour}`
    } else if (nextStartHour > 23) {
      nextStartHour = '00'
    }
    let nextStartMinutes = parseInt(startTime[1]) + 10
    if (nextStartMinutes === 60) {
      nextStartMinutes = '00'
    }
    let nextEndHour = parseInt(endTime[0]) + 1
    if (nextEndHour < 10) {
      nextEndHour = `0${nextEndHour}`
    } else if (nextEndHour > 23) {
      nextEndHour = '00'
    }
    let nextEndMinutes = parseInt(endTime[1]) + 10
    if (nextEndMinutes === 60) {
      nextEndMinutes = '00'
    }
    let markup = {
      inline_keyboard: [
        [{
          text: startTime[0] + 'h',
          callback_data: previousCommandArguments + nextStartHour + ':' + startTime[1] + '-' + command.arguments[4]
        },
        {
          text: startTime[1] + 'min',
          callback_data: previousCommandArguments + startTime[0] + ':' + nextStartMinutes + '-' + command.arguments[4]
        }],
        [{
          text: endTime[0] + 'h',
          callback_data: previousCommandArguments + command.arguments[3] + '-' + nextEndHour + ':' + endTime[1]
        },
        {
          text: endTime[1] + 'min',
          callback_data: previousCommandArguments + command.arguments[3] + '-' + endTime[0] + ':' + nextEndMinutes
        }]
      ]
    }

    markup.inline_keyboard.push([{
      text: '\u{2B05} back',
      callback_data: 'back-' + command.name
    }, {
      text: '\u{2705} done',
      callback_data: command.name + '-' + command.arguments.join('-') + '-done'
    }])
    const options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify(markup)
    }
    return api.editMessageText('Select start hours and end hours:', options)
  }

  static async pickActionToSchedule (command) {
    const ActionsData = await hioApi.get('actionnables')
    let markup = {
      inline_keyboard: ActionsData.reduce((previous, switchData) => {
        if (switchData.mode === 1 && switchData.type !== 'relay') {
          const hasSchedule = switchData.schedules && switchData.schedules.constructor === Array && switchData.schedules.length
          let button = {
            text: (hasSchedule ? '\u{1F550} ' : '') + switchData.title,
            callback_data: command.name + '-' + switchData.id
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
      text: '\u{2B05} back',
      callback_data: 'back-' + command.name
    }])
    const options = {
      chat_id: command.chatId,
      message_id: command.messageId,
      reply_markup: JSON.stringify(markup)
    }
    return api.editMessageText('Select the action you want to schedule:', options)
  }
}
