'use strict'

const QueryFile = require('pg-promise').QueryFile
const path = require('path')

module.exports = {
  initDB: sql('init.sql'),
  checkDB: sql('check.sql'),
  migrate: (up, sqlFile) => sql(`migration/${up ? 'up' : 'down'}/${sqlFile}`),
  user: {
    findAll: sql('user/findAll.sql'),
    findAllByAccessLevel: sql('user/findAllByAccessLevel.sql'),
    findAllByStatus: sql('user/findAllByStatus.sql'),
    findById: sql('user/findById.sql'),
    findByTelegramId: sql('user/findByTelegramId.sql')
  },
  role: {
    findAll: sql('role/findAll.sql')
  },
  actionnable: {
    findAll: sql('actionnable/findAll.sql'),
    findById: sql('actionnable/findById.sql')
  },
  schedule: {
    deleteById: sql('schedule/deleteById.sql')
  },
  migration: {
    findAll: sql('migration/findAll.sql')
  },
  preference: {
    find: sql('preference/find.sql')
  }
}

// Helper for linking to external query files;
function sql (file) {
  const fullPath = path.join(__dirname, file)

  const options = {
    minify: true,
    params: {
      schema: process.env.dbSchema
    }
  }

  const qf = new QueryFile(fullPath, options)

  if (qf.error) {
    // Something is wrong with our query file :(
    // Testing all files through queries can be cumbersome,
    // so we also report it here, while loading the module:
    console.error(qf.error)
  }

  return qf

  // See QueryFile API:
  // http://vitaly-t.github.io/pg-promise/QueryFile.html
}
