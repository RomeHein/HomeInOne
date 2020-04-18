const catchError = require('../catchError')
const Schedule = require('../../model/ScheduleModel')
const ActionnableController = require('../../Hardware/ActionnableController')

module.exports = function (webserver) {
  console.log('✅ API Schedule loaded')

  webserver.delete('/api/schedule/:id', async (req, res) => {
    try {
      const response = await Schedule.delete(req.params.id)
      // Reload all schedules
      await ActionnableController.initAll()
      if (response) {
        res.send(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.put('/api/schedule', async (req, res) => {
    try {
      const response = await Schedule.update(req.body)
      // Reload all schedules
      await ActionnableController.initAll()
      if (response) {
        res.send(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.post('/api/schedule', async (req, res) => {
    try {
      const response = await Schedule.save(req.body)
      // Reload all schedules
      await ActionnableController.initAll()
      if (response) {
        res.send(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })
}
