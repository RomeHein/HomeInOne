const catchError = require('../catchError')
const User = require('../../model/UserModel')
module.exports = function (webserver) {
  console.log('✅ API User loaded')

  webserver.get('/api/users', async (req, res) => {
    try {
      let users = await User.all(req.query.accessRights, req.query.status)
      res.json(users)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/user/:id', async (req, res) => {
    try {
      let user = await User.findById(req.params.id)
      res.json(user)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/user/telegram/:id', async (req, res) => {
    try {
      let user = await User.findByTelegramId(req.params.id)
      res.json(user)
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.get('/api/user/:userId/status/:statusId', async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
      if (user.status.id !== 4) {
        let update = {
          id: req.params.userId,
          status: { id: +req.params.statusId }
        }
        if (update.status.id === 4) {
          update.deletionDate = '2016-06-22 19:10:25-07'
        }
        const response = await User.update(update, true)
        if (response) {
          res.send(response)
        } else {
          res.sendStatus(200)
        }
      } else {
        res.send('User already deleted')
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.put('/api/user', async (req, res) => {
    try {
      const response = await User.update(req.body, true)
      if (response) {
        res.json(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })

  webserver.post('/api/user', async (req, res) => {
    try {
      const response = await User.save(req.body, true)
      if (response) {
        res.json(response)
      } else {
        res.sendStatus(200)
      }
    } catch (err) {
      catchError(res, err)
    }
  })
}
