const sql = require('./sql')
const pgp = require('pg-promise')()

/// Class project, handle db access
module.exports = class Actionnable {
  constructor (jsonObject) {
    if (jsonObject) {
      this.id = jsonObject.action_id
      this.state = jsonObject.action_state
      this.source = jsonObject.action_source
      this.mode = jsonObject.action_mode
      this.type = jsonObject.action_type
      this.title = jsonObject.action_title
      this.device = jsonObject.action_device
      this.schedules = jsonObject.action_schedule
      this.configuration = jsonObject.action_conf
      this.offIcon = jsonObject.action_off_icon
      this.onIcon = jsonObject.action_on_icon
    }
  }

  static parseArray (arrayObject) {
    if (arrayObject && arrayObject.constructor === Array) {
      return arrayObject.map(o => new Actionnable(o))
    }
    return []
  }

  static async findById (id) {
    if (!id) {
      throw new Error('Main parameters not defined')
    }
    const data = await Connector.db.tx(t => t.oneOrNone(sql.actionnable.findById, id))
    if (data) {
      return new Actionnable(data)
    }
  }

  static async all () {
    const data = await Connector.db.tx(t => t.manyOrNone(sql.actionnable.findAll))
    return Actionnable.parseArray(data)
  }

  async update () {
    return Actionnable.update(this)
  }

  static async update ({ id, state, title, configuration, onIcon, offIcon }, returnObject) {
    if (!id) {
      throw new Error('Identifier parameter not defined')
    }

    let updateBuilder = {}

    if (state != null) {
      updateBuilder.action_state = state
    }
    if (title) {
      updateBuilder.action_title = title
    }
    if (onIcon) {
      updateBuilder.action_on_icon = onIcon
    }
    if (offIcon) {
      updateBuilder.action_off_icon = offIcon
    }
    if (configuration) {
      updateBuilder.action_conf = configuration
    }

    let params = Object.keys(updateBuilder)
    if (params.length === 0) {
      throw new Error('No changes found to be done')
    }
    params = params.map(name => {
      if (name === 'action_conf') {
        return { name, cast: 'jsonb' }
      }
      return name
    })
    params.push('?action_id')
    updateBuilder.action_id = id

    const columnSet = pgp.helpers.ColumnSet(params, { table: { table: 'actionnable', schema: process.env.dbSchema } })
    let updateAction = pgp.helpers.update([updateBuilder], columnSet) + ` WHERE v.action_id = t.action_id  RETURNING *`
    const data = await Connector.db.task(t => t.oneOrNone(updateAction))
    if (returnObject && data) {
      return new Actionnable(data)
    }
  }

  static async save ({ id, type, title, deviceId, source, configuration, onIcon, offIcon }) {
    if (!id || !title || !source || !configuration || onIcon == null || offIcon == null) {
      throw new Error('Main parameters not defined')
    }

    const params = {
      action_id: id,
      action_type: type,
      action_source: source,
      action_device_id: deviceId,
      action_configuration: configuration,
      action_title: title,
      action_on_icon: onIcon,
      action_off_icon: offIcon
    }

    const insertUser = pgp.helpers.insert(params, Object.keys(params), 'actionnable')

    return Connector.db.tx(t => t.none(insertUser))
  }
}
