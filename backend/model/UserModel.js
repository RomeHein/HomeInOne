const sql = require('./sql')
const pgp = require('pg-promise')()
const Helper = require('../Helper')

/// Class project, handle db access
module.exports = class User {
  constructor (jsonObject) {
    if (jsonObject) {
      this.id = jsonObject.user_id
      this.role = jsonObject.user_role
      this.status = jsonObject.user_status
      this.telegramId = jsonObject.user_telegram_id
      this.telegramName = jsonObject.user_telegram_name
      this.startDateAccess = jsonObject.user_start_date
      this.endDateAccess = jsonObject.user_end_date
    }
  }

  static parseArray (arrayObject) {
    if (arrayObject && arrayObject.constructor === Array) {
      return arrayObject.map(o => new User(o))
    }
    return []
  }

  static async findById (id) {
    if (!id) {
      throw new Error('Main parameters not defined')
    }
    const data = await Connector.db.tx(t => t.oneOrNone(sql.user.findById, id))
    if (data) {
      return new User(data)
    }
  }

  static async findByTelegramId (id) {
    if (!id) {
      throw new Error('Main parameters not defined')
    }
    const data = await Connector.db.tx(t => t.oneOrNone(sql.user.findByTelegramId, id))
    if (data) {
      return new User(data)
    }
  }

  /// Return all users
  static async all (accessLevel, status) {
    const data = await Connector.db.tx(t => {
      if (accessLevel) {
        return t.manyOrNone(sql.user.findAllByAccessLevel, accessLevel)
      } else if (status) {
        return t.manyOrNone(sql.user.findAllByStatus, status)
      }
      return t.manyOrNone(sql.user.findAll)
    })
    return User.parseArray(data)
  }

  static async save ({ role, telegramId, telegramName, status }, returnObject) {
    if (!role || !telegramId) {
      throw new Error('Main parameters not defined')
    }

    const params = {
      user_id: Helper.generateID(),
      user_role_id: role.id,
      user_status_id: status.id,
      user_telegram_id: telegramId,
      user_telegram_name: telegramName
    }
    const insertUser = pgp.helpers.insert(params, Object.keys(params), 'user') + ' RETURNING *'

    return Connector.db.tx(t => t.oneOrNone(insertUser))
      .then(data => (returnObject && data ? new User(data) : null))
  }

  update (returnObject) {
    return User.update(this, returnObject)
  }

  static async update (user, returnObject) {
    if (!user.id) {
      return Promise.reject(new Error('Identifier parameter not defined'))
    }

    let updateBuilder = {}

    if (user.role) {
      updateBuilder.user_role_id = user.role.id
    }
    if (user.status) {
      updateBuilder.user_status_id = user.status.id
    }
    if (user.telegramName) {
      updateBuilder.user_telegram_name = user.telegramName
    }
    if (user.startDateAccess) {
      updateBuilder.user_start_date = user.startDateAccess
    }
    if (user.endDateAccess) {
      updateBuilder.user_end_date = user.endDateAccess
    }
    if (user.deletionDate) {
      updateBuilder.user_deletion_date = user.deletionDate
    }

    if (Object.keys(updateBuilder).length === 0) {
      return Promise.reject(new Error('No changes found to be done'))
    }

    let params = Object.keys(updateBuilder)

    params.push('?user_id')
    params = params.map(name => {
      if (name === 'user_deletion_date' || name === 'user_start_date' || name === 'user_end_date') {
        return { name, cast: 'timestamp' }
      }
      return name
    })
    updateBuilder.user_id = user.id

    const columnSet = pgp.helpers.ColumnSet(params, { table: { table: 'user', schema: process.env.boSchema } })
    const updateInformations = pgp.helpers.update([updateBuilder], columnSet) + ` WHERE v.user_id = t.user_id RETURNING *`

    return Connector.db.task(t => t.oneOrNone(updateInformations))
      .then(data => (returnObject && data ? new User(data) : null))
  }
}
