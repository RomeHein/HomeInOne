const fs = require('fs')
const request = require('request')

module.exports = class Helper {
  /**
   * Generate an Id based on the current date
   */
  static generateID () {
    var currentDate = (new Date()).valueOf()
    var random = Math.random()
    return Number((currentDate + random).toFixed(0))
  };

  static fetchImage (url, filename) {
    if (filename == null) {
      filename = './pics/temp.jpg'
    }

    return new Promise((resolve, reject) => {
      if (url == null) {
        reject(new Error('No url provided'))
      }
      request.head(url, (err, res, body) => {
        if (err) {
          reject(err)
        }

        request(url).pipe(fs.createWriteStream(filename)).on('close', err2 => {
          if (err2) {
            reject(new Error('Could not save image localy'))
          } else {
            resolve(filename)
          }
        })
      })
    })
  }

  /**
   * Return the value of the last path in object
   * @param {Object} object The object to dig
   * @param {Array} paths a path type like [data,path1,path2]
   */
  static dig (object, paths) {
    const nextObject = object[paths[0]]
    if (nextObject) {
      if (paths.length > 1) {
        return this.dig(nextObject, paths.slice(1))
      }
      return nextObject
    }
    return object
  }

  static isNumeric (string) {
    return /^[0-9.]+$/.test(string)
  }

  // Format YYYY-MM-DD HH:MM:SS.SSS
  static dateFromString (dateString) {
    return new Date(dateString.substring(0, 4), dateString.substring(6, 8), dateString.substring(10, 12), dateString.substring(14, 16), dateString.substring(18, 20))
  }

  static addZero (i) {
    if (i < 10) {
      i = '0' + i
    }
    return i
  }

  static getDateStringFromDate (date) {
    var dd = Helper.addZero(date.getDate())
    var mm = Helper.addZero(date.getMonth())
    var yyyy = date.getFullYear()
    return yyyy + '-' + mm + '-' + dd
  }

  static getHourStringFromDate (date) {
    var hh = Helper.addZero(date.getHours())
    var mm = Helper.addZero(date.getMinutes())
    var ss = Helper.addZero(date.getSeconds())
    return hh + ':' + mm + ':' + ss + '.000'
  }

  static getFullDateStringFromDate (date) {
    return Helper.getDateStringFromDate(date) + ' ' + Helper.getHourStringFromDate(date)
  }

  static getDifferenceInHoursFromDates (date1, date2) {
    var date1true = new Date(date1)
    var date2true = new Date(date2)
    return Number((Math.abs(date1true - date2true) / 36e5).toFixed(1))
  }

  static checkStringMatchHour (hourString) {
    if (hourString.substring(0, 2) > 23) {
      return false
    }
    if (hourString.substring(2, 4) > 59) {
      return false
    }
    return true
  }
}
