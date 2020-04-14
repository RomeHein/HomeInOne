const Gpio = require('./Hardware').gpio
const piModuleHelper = require('./Hardware').piModule
const telegramCameraHandler = require('../Telegram/controller/Camera')
const sleep = require('util').promisify(setTimeout)
const Actionnable = require('../model/ActionnableModel')
const axios = require('axios')
const MqttConnector = require('../mqtt/MqttConnector')
const Helper = require('../Helper')

// Store all controllers so that we don't query the db every time
let actionControllers = {}
// Keep reference to the scheduler
let scheduler = null

const mqtt = new MqttConnector(process.env.dbUser, process.env.dbUserPassword)
mqtt.client.on('message', (topic, message) => {
  for (let actionnable of Object.values(actionControllers)) {
    if (actionnable.model.source === 'mqtt' && actionnable.model.configuration.topic === topic) {
      actionnable.model.state = +(message.toString())
      actionnable.model.update()
      return
    }
  }
})

module.exports = class ActionnableController {
  constructor (model) {
    this.model = model || {}
    // Initiate gpio only if the action is meant to be controled directly by the board
    if (model.source === 'onboard') {
      this.gpio = ActionnableController.initGpio(model)
    }
  }

  static initGpio (model) {
    let gpio = null
    // Read mode
    if (model.mode === 0) {
      gpio = new Gpio(model.configuration.pin,
        {
          mode: Gpio.INPUT,
          pullUpDown: (model.configuration.onValue && !model.configuration.offValue) ? Gpio.PUD_DOWN : Gpio.PUD_UP,
          edge: Gpio.EITHER_EDGE
        })
      if (process.env.node_env !== 'development') {
        gpio.on('interrupt', async (level) => {
          await this.switch(null, level)
        })
      }
      // Write mode
    } else {
      gpio = new Gpio(model.configuration.pin, { mode: Gpio.OUTPUT })
    }
    return gpio
  }

  static async init (model, initialStateToOff) {
    const actionController = new ActionnableController(model)
    actionControllers[model.id] = actionController
    // If the state is set to -1, we let the scheduler do the job
    if (model.mode === 1 && model.state === -1) {
      return actionController.checkSchedule()
    } else if (model.mode === 1) {
      // Subscribe to topic for mqtt actionnable
      if (model.source === 'mqtt' && model.configuration.topic) {
        // Don't block initialisation for subscription. Can be perform in parallel
        mqtt.client.subscribe(model.configuration.topic)
      }
      switch (model.type) {
        case 'impulse' || 'servo':
          return actionController.set(false)
        case 'relay':
          return actionController.set(true)
        case 'switch':
          return actionController.set(initialStateToOff ? model.offValue : model.state)
      }
    }
  }

  static async initAll (initialStateToOff) {
    let models = await Actionnable.all()
    // We don't use Promise.all here because we don't want to ddos iot devices that could be sensibles to multiple requests.
    for (const model of models) {
      const actionnable = actionControllers[model.id]
      if (actionnable) {
        // Reload gpio only if user updated it
        if (actionnable.model.configuration.pin !== model.configuration.pin) {
          actionnable.gpio = ActionnableController.initGpio(model)
        }
        actionnable.model = model
      } else {
        try {
          await this.init(model, initialStateToOff)
        } catch (err) {
          console.log(`❌ Actionnable ${model.id} initialisation error: ${err}`)
        }
      }
    }
    // Init scheduler
    if (!scheduler) {
      scheduler = setInterval(this.checkAllSchedule, 60000)
    }
  }

  static async checkAllSchedule () {
    for (const actionnableId in actionControllers) {
      const actionnable = actionControllers[actionnableId]
      await actionnable.checkSchedule()
    }
  }

  async checkSchedule () {
    const schedules = this.model.schedules
    if (this.model.state === -1 && schedules && schedules.constructor === Array && schedules.length) {
      const currentDate = new Date()
      const currentDay = currentDate.getDay()
      const currentTime = Helper.getHourStringFromDate(currentDate)

      let shouldTurnOn = false
      for (const schedule of schedules) {
        if (schedule.days.indexOf(currentDay) > -1 && currentTime >= schedule.startHour && currentTime <= schedule.endHour) {
          shouldTurnOn = true
        }
      }
      // AvoidStateUpdate to disable
      await this.switch(shouldTurnOn ? 'on' : 'off', null, true)
    }
  }

  static async switch (id, state) {
    let controller = actionControllers[id]
    if (!controller) {
      const model = await Actionnable.findById(id)
      if (model) {
        controller = new ActionnableController(model)
      }
    }
    if (controller) {
      return controller.switch(state)
    }
  }

  /**
   * Switch the state of an actionnable.
   * @param {String} state 'on' or 'off'. If null is passed, the opposite state of the switch will be activated
   * @param {Integer} level Level is only use for INPUT pins.
   * @param {Bool} avoidPersistence Avoid persisting switch state in the memory and DB
   */
  async switch (state, level, avoidPersistence) {
    if (level != null) {
      // We are dealing with a captor or button
      if (this.model.id === 'intercom' && level) {
        if (process.env.piModule) {
          // Plays imperial starwars march
          await piModuleHelper.playSounds([[220, 700], [220, 700], [220, 700],
            [174, 525], [261, 175], [220, 700],
            [174, 525], [261, 175], [220, 1400]])
        }
        if (process.env.telegramToken) {
          await telegramCameraHandler.knockknock()
        }
      }
    } else {
      // We are dealing with an action
      if (this.model.type === 'impulse') {
        // Impulse are just actions that are means to be on for few miliseconds
        await this.set(true)
        await sleep(100)
        await this.set(false)
      } else {
        // Deals with normal switches (servo motor or just digital pins)
        if (state === 'schedule') {
          this.model.state = -1
          await this.model.update()
          await this.checkSchedule()
        } else {
          const newState = ((!state && !(await this.isOn())) || state === 'on')
          await this.set(newState)
          if (!avoidPersistence) {
            this.model.state = +(newState)
            await this.model.update()
          }
        }
      }
    }
    return this
  }

  async isOn () {
    let result
    switch (this.model.source) {
      case 'onboard':
        if (this.model.type === 'servo') {
          result = this.getPulseWidth()
        } else if (this.model.type === 'switch' || this.model.type === 'relay') {
          result = this.gpio.digitalRead()
        }
        break
      case 'pimodule':
        if (process.env.piModule === true && this.model.configuration.method === 'relay') {
          result = piModuleHelper.getBiStableRelayState()
        }
        break
      case 'api':
        const resp = await axios.get(this.model.configuration.readUrl)
        if (this.model.configuration.readPayloadPath) {
          result = Helper.dig(resp, this.model.configuration.readPayloadPath.split('.'))
        } else {
          result = resp
        }
        break
      default:
        result = this.model.state
        break
    }
    return result === this.model.configuration.onValue
  }

  async set (on) {
    switch (this.model.source) {
      case 'onboard':
        if (this.model.mode === 1) {
          const nextState = (on ? this.model.configuration.onValue : this.model.configuration.offValue)
          if (this.model.type === 'servo') {
            this.gpio.servoWrite(nextState)
          } else if (this.model.type === 'switch' || this.model.type === 'relay' || this.model.type === 'impulse') {
            this.gpio.digitalWrite(nextState)
          }
        }
        break
      case 'pimodule':
        if (process.env.piModule) {
          switch (this.model.configuration.method) {
            case 'relay':
              return piModuleHelper.switchBiStableRelay(on)
          }
        }
        break
      case 'api':
        const nextStateApi = (on ? this.model.configuration.onPayload : this.model.configuration.offPayload)
        switch (this.model.configuration.method) {
          case 'GET':
            if (nextStateApi.constructor === String) {
              return axios.get(this.model.configuration.writeUrl + nextStateApi, { timeout: 5000 })
            } else {
              return axios.get(this.model.configuration.url, { params: nextStateApi, timeout: 5000 })
            }
          case 'POST':
            return axios.post(this.model.configuration.url, { params: nextStateApi, timeout: 5000 })
        }
        break
      case 'mqtt':
        const nextState = (on ? this.model.configuration.onValue : this.model.configuration.offValue)
        if (this.model.configuration.topic) {
          await mqtt.client.publish(this.model.configuration.topic, `${nextState}`)
        }
        break
    }
  }

  // Only for servo motors
  getPulseWidth () {
    try {
      return this.gpio.getServoPulseWidth()
    } catch (err) {
      return 0
    }
  }
}
