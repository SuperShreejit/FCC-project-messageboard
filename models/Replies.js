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
  },
  createdAt: {
    type: Date,
    default: new Date()
  },
  updatedAt: {
    type: Date,
    default: new Date()
  }
})

module.exports = mongoose.model('Replies', ReplySchema)