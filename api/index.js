const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

module.exports = async () => {
  const port = process.env.apiPort || 8080

  let webserver = express()
  webserver.use(bodyParser.json())
  webserver.use(bodyParser.urlencoded({ extended: true }))
  webserver.use(express.static('public'))

  webserver.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))

  webserver.listen(port)

  // import all the pre-defined routes that are present in /api/controller that will create the restfull API
  let normalizedPathRoutes = path.join(__dirname, 'controller')
  fs.readdirSync(normalizedPathRoutes).forEach(function (file) {
    require('./controller/' + file)(webserver)
  })

  return webserver
}
