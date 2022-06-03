const mongoose = require('mongoose')

const ReplySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reported: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Replies', ReplySchema)