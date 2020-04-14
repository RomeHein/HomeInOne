const axios = require('axios')
const Telegram = require('node-telegram-bot-api')

function startTelegramApi () {
  return new Telegram(process.env.telegramToken, { polling: true })
}

const localApi = process.env.apiAddress
let telegramApi = startTelegramApi()

module.exports = {
  hio: {
    get: async (resource, params = {}) => {
      const resp = await axios.get(localApi + resource, { params })
      if (resp && resp.data) {
        return resp.data
      }
    },
    delete: async (resource, params = {}) => {
      const resp = await axios.delete(localApi + resource, params)
      if (resp && resp.data) {
        return resp.data
      }
    },
    put: async (resource, params = {}) => {
      const resp = await axios.put(localApi + resource, params)
      if (resp && resp.data) {
        return resp.data
      }
    },
    post: async (resource, params = {}) => {
      const resp = await axios.post(localApi + resource, params)
      if (resp && resp.data) {
        return resp.data
      }
    }
  },
  telegram: telegramApi
}
