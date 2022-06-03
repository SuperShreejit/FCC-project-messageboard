'use strict';
const bcrypt = require('bcrypt')
const Board = require('../models/Board')
const Thread = require('../models/Thread')
const Reply = require('../models/Replies')

// https://github.com/SuperShreejit/FCC-project-messageboard
module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(async(req,res) => {
      const boardName = req.params.board
      try {
        const board = await getBoard(boardName)
        const threads = await Thread.find({ boardId: board.id })
          .sort({ updatedAt: "desc" }).limit(10).exec() 
        if(threads.length > 0) 
          for(let i = 0; i < threads.length; i++) {
            const replies = await Reply.find({ threadId: threads[i]._id })
              .sort({ createdAt: "desc" })
              .limit(3).exec()
            const repliesData = getRepliesData(replies)
            threads[i].replies = repliesData
          }
        
        const threadsData = threads.map(thread => ({
          _id: thread.id,
          text: thread.text,
          created_on: thread.createdAt,
          bumped_on: thread.updatedAt,
          replycount: thread.replycount,
          replies: thread.replies
        }))
        res.json(threadsData)        
      } catch (error) {
        console.error(error.message)
      }
    })
    .post(async(req,res) => {
      const boardName = req.params.board
      const { text, delete_password } = req.body
      try {
        console.log(req.body, "post thread req")
        if(!text || !delete_password) return res.send(MESSAGE.MISSING)
        
        const board = await getBoard(boardName)
        const hash = await getHashedPassword(delete_password)
        const thread = new Thread({
          text, password: hash, boardId: board.id
        })
        const newThread = await thread.save()
        
        const threadData = getThreadData(thread, [])              
        res.json(threadData)
      } catch (error) {
        console.error(error.message)
      }
    })
    .put(async(req,res) => {
      const { report_id } = req.body
      try {
        console.log(req.body, "put thread req")
        if(!report_id) return res.send(MESSAGE.MISSING)

        const thread = await Thread.findById(report_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)
        
        const query = { reported: true }
        await Thread.findByIdAndUpdate(report_id, query, { runValidators: true })
        res.send(MESSAGE.REPORTED)        
      } catch (error) {
        console.error(error.message)
      }
    })
    .delete(async(req,res) => {
      const { thread_id, delete_password } = req.body
      try {
        console.log(req.body, "delete thread req ")
        if(!thread_id || !delete_password) return res.send(MESSAGE.MISSING)
        const thread = await Thread.findById(thread_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)

        const isValidPassword = await bcrypt.compare(delete_password, thread.password)
        if (!isValidPassword)
          return res.send(MESSAGE.INCORRECT_PASSWORD)

        await Reply.deleteMany({ threadId: thread_id })
        await Thread.findByIdAndRemove(thread_id)
        res.send(MESSAGE.SUCCESS)
      } catch (error) {
        console.error(error.message)
      }
    })

  // FCC thread id: 62974d7917c10d53eefacda5 board=testsuper
  app.route('/api/replies/:board')
    .get(async(req,res) => {
      const { thread_id } = req.query
      try {        
        if(!thread_id) return res.send(MESSAGE.MISSING)

        const thread = await Thread.findById(thread_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)
        const replies = await Reply.find({ threadId: thread_id }).exec()

        const threadData = getThreadData(thread, replies)
        res.json(threadData)        
      } catch (error) {
        console.error(error.message)
      }
    })
    .post(async(req,res) => {
      const { text, delete_password, thread_id } = req.body
      try {
        console.log(req.body, "post reply request")
        if(!text || !delete_password || !thread_id) 
          return res.send(MESSAGE.MISSING)

        const thread = await Thread.findById(thread_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)
        
        const hash = await getHashedPassword(delete_password)
        const reply = new Reply({
          text, password: hash, threadId: thread_id
        })
        const newReply = await reply.save()
        
        const query = { replycount: thread.replycount+1, updatedAt: newReply.updatedAt }
        const updatedThread = await Thread.findByIdAndUpdate(thread_id, query, { new: true, runValidators: true })
        const replyData = { _id: newReply._id, text: newReply.text, created_on: newReply.createdAt }
        // console.log(replyData, "post reply response")
        res.json(replyData)
      } catch (error) {
        console.error(error.message)
      }
    })
    .put(async(req,res) => {
      const { thread_id, reply_id } = req.body
      try {
        console.log(req.body, "put reply req")
        if(!thread_id || !reply_id) return res.send(MESSAGE.MISSING)

        const thread = await Thread.findById(thread_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)

        const reply = await Reply.findById(reply_id)
        if(!reply) return res.send(MESSAGE.INVALID_REPLY_ID)

        const replyQuery = { reported: true }
        const newReply = await Reply.findByIdAndUpdate(reply_id, replyQuery, { runValidators: true, new: true })
        
        const threadQuery = { updatedAt: newReply.updatedAt }
        await Thread.findByIdAndUpdate(thread_id, threadQuery, { runValidators: true })
        res.send(MESSAGE.REPORTED)
      } catch (error) {
        console.error(error.message)
      }
    })
    .delete(async(req,res) => {
      const { thread_id, reply_id, delete_password } = req.body
      try {
        console.log(req.body, "delete replies req")
        if(!thread_id || !reply_id || !delete_password) return res.send(MESSAGE.MISSING)

        const thread = await Thread.findById(thread_id)
        if(!thread) return res.send(MESSAGE.INVALID_ID)

        const reply = await Reply.findById(reply_id)
        if(!reply) return res.send(MESSAGE.INVALID_REPLY_ID)

        const isValidPassword = await bcrypt.compare(delete_password, reply.password)
        if(!isValidPassword) return res.send(MESSAGE.INCORRECT_PASSWORD)

        const replyQuery = { text: DELETED_TEXT }
        const newReply = await Reply.findByIdAndUpdate(reply_id, replyQuery, { runValidators: true, new: true })

        const threadQuery = { updatedAt: newReply.updatedAt }
        await Thread.findByIdAndUpdate(thread_id, threadQuery, { runValidators: true })
        res.send(MESSAGE.SUCCESS)
      } catch (error) {
        console.error(error.message)
      }
    })
  
};

const getBoard = async (name) => {
  try {
    let board = await Board.findOne({ name }).exec()
    if(!board) {
      const newBoard = new Board({ name })
      board = await newBoard.save()
    }
    return board
  } catch (error) {
    console.error(error.message)
  }
}

const getHashedPassword = async (password) => {
  const SALT_ROUNDS = 10
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return await bcrypt.hash(password, salt)
}

const getThreadData = (thread, replies) => ({
    _id: thread._id,
    text: thread.text,
    created_on: thread.createdAt,
    bumped_on: thread.updatedAt,
    replycount: thread.replycount,
    replies: replies.length < 1 ? [] : getRepliesData(replies)
})   

const getRepliesData = (replies) => replies.map(reply => ({
        _id: reply._id,
        text: reply.text,
        created_on: reply.createdAt
      }))

const DELETED_TEXT = "[deleted]"
const MESSAGE = {
    INVALID_ID: "Invalid Thread Id provided",
    INVALID_REPLY_ID: "Invalid reply Id provided",
    MISSING: "Missing required field(s)",
    INCORRECT_PASSWORD: "incorrect password",
    SUCCESS: "success",
    REPORTED: "reported"
  }
/*
fetch("/api/replies/general", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "testabc",
    delete_password: "asd",
    thread_id: "6296fb3a747f224c054b8fc3"
  })
}).then(res=> res.json()).then(data=> console.log(data)).catch(err=> console.error(err.message))
*/