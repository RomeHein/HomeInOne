const pgp = require('pg-promise')()
const sql = require('./sql')
const fs = require('fs')
const util = require('util')
const readdir = util.promisify(fs.readdir)

let instance = null

module.exports = class Connector {
  constructor (user, psw) {
    if (!instance || (user && psw)) {
      instance = this

      this.config = {
        user: user || process.env.dbUser,
        database: process.env.db,
        password: psw || process.env.dbUserPassword,
        host: process.env.dbHost,
        port: process.env.dbPort
      }

      this.db = pgp(this.config)
    }
    return instance
  }

  /**
   * Migrate db up or down. Migration files must be written in plain sql and be ordered. The script will play files top to bottom.
   * @param {Bool} down
   * @param {Date} toDate As each migration is saved in the db with its date, it's possible to specify 'toDate' in order to limit migrations down to a specific date
   */
  async migrateDB (down, toDate) {
    const dir = `./model/sql/migration/${down ? 'down' : 'up'}/`
    const migrationsPlayed = (await this.db.tx(t => t.manyOrNone(sql.migration.findAll)))
    const migrationsToPlay = (await readdir(dir))
      .reduce((previous, migrationFile) => {
        const migration = migrationsPlayed.find(m => m.migration_name === migrationFile)
        if (down && migration && migration.migration_date > toDate) {
          previous.push(migrationFile)
        } else if (!migration) {
          previous.push(migrationFile)
        }
        return previous
      }, [])
    if (migrationsToPlay.length) {
      console.log('⚠️ DB needs migration')
      // Play migrations
      await this.db.task(t => {
        const migrationQueries = migrationsToPlay.map(migrationFile => t.none(sql.migrate(true, migrationFile)))
        return t.batch(migrationQueries)
      })
      // Then save migrations if everything went well
      await this.db.task(t => {
        const saveQueries = migrationsToPlay.map(migrationFile => {
          const params = {
            migration_name: migrationFile,
            migration_date: new Date()
          }
          return t.none(pgp.helpers.insert(params, Object.keys(params), 'migration'))
        })
        return t.batch(saveQueries)
      })
    }
  }

  async checkIntegrity () {
    const result = await this.db.tx(t => t.oneOrNone(sql.checkDB))
    if (result.test !== 0) {
      let err = new Error(`⚠️ DB is missing some important data. Code error: ${result.test}`)
      err.code = result.test
      throw err
    }
  }

  async initDB () {
    return this.db.tx(t => t.oneOrNone(sql.initDB))
  }
}
