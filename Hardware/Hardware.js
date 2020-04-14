const PiCamera = require('pi-camera')
const pigpio = require(process.env.node_env === 'development' ? 'pigpio-mock' : 'pigpio')

if (process.env.node_env !== 'development') {
  pigpio.configureClock(10, pigpio.CLOCK_PCM)
}

const camera = new PiCamera({
  mode: 'photo',
  output: `${__dirname}/intercom.jpg`,
  width: 640,
  height: 480,
  nopreview: true
})

let piModule = null
if (process.env.piModule) {
  const PiModuleHelper = require('pimodule')
  piModule = new PiModuleHelper()
}

module.exports = {
  camera,
  gpio: pigpio.Gpio,
  piModule
}
