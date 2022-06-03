const mongoose = require('mongoose')

const ThreadSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  replycount: {
    type: Number,
    default: 0
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

module.exports = mongoose.model('Thread', ThreadSchema)