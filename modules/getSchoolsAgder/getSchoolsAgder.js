'use strict'

const schools = require('./schools.json')

module.exports = options => {
  if (!options) {
    return schools
  } else {
    const key = Object.keys(options)[0]
    const value = options[key]
    const pattern = new RegExp(value, 'i')

    const exactMatch = schools.filter(school => school[key] === value)
    const patternMatch = schools.filter(school => pattern.test(school[key]))
    return exactMatch.length > 0 ? exactMatch : patternMatch
  }
}
