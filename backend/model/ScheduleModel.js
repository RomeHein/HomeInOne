const pgp = require('pg-promise')()
const sql = require('./sql')

/// Class project, handle db access
module.exports = class Schedule {
  constructor (jsonObject) {
    if (jsonObject) {
      this.id = jsonObject.schedule_id
      this.actionId = jsonObject.action_id
      this.days = jsonObject.schedule_days
      this.startTime = jsonObject.schedule_start_hour
      this.endTime = jsonObject.schedule_end_hour
    }
  }

  static parseArray (arrayObject) {
    if (arrayObject && arrayObject.constructor === Array) {
      return arrayObject.map(o => new Schedule(o))
    }
    return []
  }

  static async delete (id) {
    if (!id) {
      throw new Error('Id is needed')
    }
    return Connector.db.tx(t => t.manyOrNone(sql.schedule.deleteById, id))
  }

  async update () {
    return Schedule.update(this)
  }

  static async update ({ id, days, startTime, endTime }, returnObject) {
    if (!id) {
      throw new Error('Identifier parameter not defined')
    }

    let updateBuilder = {}

    if (days) {
      updateBuilder.schedule_days = days
    }
    if (startTime) {
      updateBuilder.schedule_start_hour = startTime
    }
    if (endTime) {
      updateBuilder.schedule_end_hour = endTime
    }

    let params = Object.keys(updateBuilder)
    if (params.length === 0) {
      throw new Error('No changes found to be done')
    }

    params.push('?schedule_id')
    params = params.map(name => {
      if (name === 'schedule_days') {
        return { name, cast: 'integer[]' }
      }
      return name
    })
    updateBuilder.schedule_id = +id

    const columnSet = pgp.helpers.ColumnSet(params, { table: { table: 'schedule', schema: process.env.dbSchema } })
    let updateSchedule = pgp.helpers.update([updateBuilder], columnSet) + ` WHERE v.schedule_id = t.schedule_id`
    if (returnObject) {
      updateSchedule += ' RETURNING *'
    }
    const data = await Connector.db.task(t => t.oneOrNone(updateSchedule))
    if (data) {
      return new Schedule(data)
    }
    return null
  }

  static async save ({ actionId, days, startTime, endTime }) {
    if (!actionId || !days || !startTime || !endTime) {
      throw new Error('Main parameters not defined')
    }

    const params = {
      action_id: actionId,
      schedule_days: days,
      schedule_end_hour: endTime,
      schedule_start_hour: startTime
    }

    const insertSchedule = pgp.helpers.insert(params, Object.keys(params), 'schedule')

    return Connector.db.tx(t => t.none(insertSchedule))
  }
}
