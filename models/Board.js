const mongoose = require('mongoose')

const BoardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Board', BoardSchema)