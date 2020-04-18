
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('../swagger.json')

module.exports = webserver => {
  console.log('✅ API documentation loaded')

  webserver.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}
