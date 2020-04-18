const catchError = require('../catchError')
const Hardware = require('../../Hardware/Hardware')
const Actionnable = require('../../model/ActionnableModel')
const ActionnableController = require('../../Hardware/ActionnableController')

module.exports = webserver => {
  console.log('✅ API Actionnable loaded')

  webserver.get('/api/actionnables', async (req, res) => {
    try {
      let actionnables = await Actionnable.all()
      res.send(actionnables)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/actionnable/:id', async (req, res) => {
    try {
      let actionnable = await Actionnable.findById(req.params.id)
      res.send(actionnable)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.put('/api/actionnable', async (req, res) => {
    try {
      const response = await Actionnable.update(req.body)
      if (response) {
        res.send(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.post('/api/actionnable', async (req, res) => {
    try {
      const response = await Actionnable.save(req.body)
      if (response) {
        res.send(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/actionnable/switch/:id/:state?', async (req, res) => {
    try {
      const model = (await ActionnableController.switch(req.params.id, req.params.state)).model
      res.status(200).send(model)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/camera', async (req, res) => {
    try {
      await Hardware.camera.snap()
      res.status(200).sendFile('../../Hardware/intercom.jpg')
    } catch (err) {
      catchError(res, err)
    }
  })
}
