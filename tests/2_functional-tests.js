const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');
const Reply = require('../models/Replies');
const bcrypt = require('bcrypt');

chai.use(chaiHttp);
const threadsRoute = '/api/threads/general';
const repliesRoute = '/api/replies/general';
const DELETED_TEXT = '[deleted]';
const MESSAGE = {
	INVALID_ID: 'Invalid Thread Id provided',
	INVALID_REPLY_ID: 'Invalid reply Id provided',
	MISSING: 'Missing required field(s)',
	INCORRECT_PASSWORD: 'incorrect password',
	SUCCESS: 'success',
	REPORTED: 'reported'
};

suite('Functional Tests', function() {
  this.timeout(3000)
	suite('Creating a new thread: POST request to /api/threads/{board}', () => {
		let threadId = '';
		test('post new thread', async () => {
			const request = { text: 'test_text', delete_password: 'test_password' };
			const res = await chai
				.request(server)
				.post(threadsRoute)
				.send(request);
			assert.equal(res.status, 200, 'must be a successful request');
			assert.equal(res.type, 'application/json', 'response must be json');
			assert.isObject(res.body, 'body must be an Object');
			assert.property(res.body, '_id', 'must have a property of _id');
			assert.property(res.body, 'text', 'must have a property of text');
			assert.property(
				res.body,
				'created_on',
				'must have a property of created_on'
			);
			assert.property(
				res.body,
				'bumped_on',
				'must have a property of bumped_on'
			);
			assert.property(
				res.body,
				'replycount',
				'must have a property of replycount'
			);
			assert.property(res.body, 'replies', 'must have a property of replies');
			const {
				_id,
				text,
				created_on,
				bumped_on,
				replycount,
				replies
			} = res.body;
			assert.isString(_id, 'id must be a string');
			assert.isString(text, 'text must be a string');
			assert.equal(
				text,
				request.text,
				'text must be equal to what was requested'
			);
			assert.isString(created_on, 'created_on must be a String');
			assert.isString(bumped_on, 'bumped_on must be a string');
			assert.isNumber(replycount, 'replycount must be a number');
			assert.equal(replycount, 0, 'initialized threads must have no replies');
			assert.isArray(replies, 'replies must be an array');
			assert.isEmpty(
				replies,
				'initialized threads must have empty replies array'
			);
			threadId = _id;
		});

		after(async () => {
			await Thread.findByIdAndDelete(threadId);
		});
	});

	suite(
		'Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}',
		() => {
      this.timeout(3000)
      
			test('viewing 10 threads ', async () => {
				const res = await chai.request(server).get(threadsRoute);
				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'application/json', 'response must be json');
				assert.isArray(res.body, 'returned response body must be an array');
				assert.equal(
					res.body.length,
					10,
					'reponse body array length must be 10'
				);
				const thread = res.body[0];
				assert.isObject(thread, 'thread must be an object');
				assert.property(thread, '_id', 'thread must have a property of _id');
				assert.property(thread, 'text', 'thread must have a property of text');
				assert.property(
					thread,
					'created_on',
					'thread must have a property of created_on'
				);
				assert.property(
					thread,
					'bumped_on',
					'thread must have a property of bumped_on'
				);
				assert.property(
					thread,
					'replycount',
					'thread must have a property of replycount'
				);
				assert.property(
					thread,
					'replies',
					'thread must have a property of replies'
				);
				const {
					_id,
					text,
					created_on,
					bumped_on,
					replycount,
					replies
				} = thread;
				assert.isString(_id, 'id must be a string');
				assert.isString(text, 'text must be a string');
				assert.isString(created_on, 'created_on must be a String');
				assert.isString(bumped_on, 'bumped_on must be a string');
				assert.isNumber(replycount, 'replycount must be a number');
				assert.isArray(replies, 'replies must be an array');
			});
      
		}); 

	suite(
		'Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password',
		() => {
			let threadId = '';
			before(async () => {
				const postRequest = {
					text: 'test_text',
					password: 'test_password',
					boardId: '6297931c1ca9bf53ea1709c7'
				};
				const thread = await Thread.create(postRequest);
				threadId = thread._id;
			});

			test('delete /api/threads', async () => {
				const request = {
					thread_id: threadId,
					delete_password: 'incorrect_password'
				};
				const res = await chai
					.request(server)
					.delete(threadsRoute)
					.send(request);
				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'text/html', 'response must be text');
				assert.equal(
					res.text,
					MESSAGE.INCORRECT_PASSWORD,
					`response must be ${MESSAGE.INCORRECT_PASSWORD}`
				);
			});

			after(async () => {
				await Thread.findByIdAndDelete(threadId);
			});
		}
	);

	suite(
		'Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password',
		() => {
			const postRequest = {
				text: 'test_text',
				password: 'test_password',
				boardId: '6297931c1ca9bf53ea1709c7'
			};
			let threadId = '';
			before(async () => {
				const salt = await bcrypt.genSalt(10);
				const hash = await bcrypt.hash(postRequest.password, salt);
				const thread = await Thread.create({
					text: 'test_text',
					password: hash,
					boardId: '6297931c1ca9bf53ea1709c7'
				});
				threadId = thread._id;
			});

			test('testing delete', async () => {
				const request = {
					thread_id: threadId,
					delete_password: postRequest.password
				};
				const res = await chai
					.request(server)
					.delete(threadsRoute)
					.send(request);

				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'text/html', 'response must be text');
				assert.equal(
					res.text,
					MESSAGE.SUCCESS,
					`response must be ${MESSAGE.SUCCESS}`
				);
			});
		}
	);

	suite('Reporting a thread: PUT request to /api/threads/{board}', () => {
		let threadId = '';
		before(async () => {
			const postRequest = {
				text: 'test_text',
				password: 'test_password',
				boardId: '6297931c1ca9bf53ea1709c7'
			};
			const thread = await Thread.create(postRequest);
			threadId = thread.id;
		});

		test('put request /api/threads/:board', async () => {
			const request = { report_id: threadId };
			const res = await chai
				.request(server)
				.put(threadsRoute)
				.send(request);

			assert.equal(res.status, 200, 'must be a successful request');
			assert.equal(res.type, 'text/html', 'response must be text');
			assert.equal(
				res.text,
				MESSAGE.REPORTED,
				`response must be ${MESSAGE.REPORTED}`
			);
		});

		after(async () => {
			await Thread.findByIdAndDelete(threadId);
		});
	});

	suite('Creating a new reply: POST request to /api/replies/{board}', () => {
		const postThreadRequest = {
			text: 'test_text',
			password: 'test_password',
			boardId: '6297931c1ca9bf53ea1709c7'
		};
		let threadId = '';
		before(async () => {
			const thread = await Thread.create(postThreadRequest);
			threadId = thread.id;
		});

		test('post to /api/replies/', async () => {
			const request = {
				thread_id: threadId,
				text: 'reply_test',
				delete_password: 'test_password'
			};
			const res = await chai
				.request(server)
				.post(repliesRoute)
				.send(request);
			assert.equal(res.status, 200, 'must be a successful request');
			assert.equal(res.type, 'application/json', 'response must be json');
			assert.isObject(res.body, 'body must be an object');
      const { replies, replycount, bumped_on } = res.body
      assert.equal(replies.length, replycount, "replies length must be equal to replycount")
			const reply = replies[0];
			assert.isObject(reply, 'reply must be an object');
			assert.property(reply, '_id', 'reply must have a _id property');
			assert.property(
				reply,
				'created_on',
				'reply must have a created_on property'
			);
			assert.property(reply, 'text', 'reply must have a text property');
			const { _id, text, created_on } = reply;
			assert.isString(_id, 'id must be a string');
			assert.isString(text, 'text must be a string');
			assert.equal(
				text,
				request.text,
				'text must be equal to what was requested'
			);
			assert.isString(created_on, 'created_on must be a string');
      assert.equal(created_on, bumped_on, "reply's created_on must match thread's bumped_on")
		});

		after(async () => {
			await Reply.deleteOne({ threadId });
			await Thread.findByIdAndDelete(threadId);
		});
	});

	suite(
		'Viewing a single thread with all replies: GET request to /api/replies/{board}',
		() => {
			const postThreadRequest = {
				text: 'test_text',
				password: 'test_password',
				boardId: '6297931c1ca9bf53ea1709c7'
			};
			let threadId = '';
			before(async () => {
				const thread = await Thread.create(postThreadRequest);
				threadId = thread._id;
				const replies = [
					{
						threadId: threadId,
						text: 'test_reply1',
						password: 'test_password1'
					},
					{
						threadId: threadId,
						text: 'test_reply2',
						password: 'test_password2'
					},
					{
						threadId: threadId,
						text: 'test_reply3',
						password: 'test_password3'
					}
				];
				await Reply.create(replies);
			});

			test('get /api/replies', async () => {
				const res = await chai
					.request(server)
					.get(`${repliesRoute}?thread_id=${threadId}`);

				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'application/json', 'response must be json');
				assert.isObject(res.body, 'response must be an object');
				assert.property(res.body, '_id', 'response must have an _id property');
				assert.property(res.body, 'text', 'response must have a text property');
				assert.property(
					res.body,
					'created_on',
					'response must have a created-on property'
				);
				assert.property(
					res.body,
					'bumped_on',
					'response must have a bumped_on property'
				);
				assert.property(
					res.body,
					'replycount',
					'response must have a replycount property'
				);
				assert.property(
					res.body,
					'replies',
					'response must have a replies property'
				);
				const {
					_id,
					text,
					created_on,
					bumped_on,
					replycount,
					replies
				} = res.body;
				assert.isString(_id, '_id must be a string');
				assert.isString(text, 'text must be a string');
				assert.isString(created_on, 'created_on must be a string');
				assert.isString(bumped_on, 'bumped_on must be a string');
				assert.isNumber(replycount, 'replycount must be a number');
				assert.isArray(replies, 'replies must be an array');
				replies.forEach(reply => {
					assert.isObject(reply, 'reply must be an object');
					assert.property(reply, '_id', 'replies must have an _id property');
					assert.property(reply, 'text', 'replies must have a text property');
					assert.property(
						reply,
						'created_on',
						'replies must have a created-on property'
					);
					const { _id, text, created_on } = reply;
					assert.isString(_id, ' _id must be a string');
					assert.isString(text, 'text must be a string');
					assert.isString(created_on, 'created_on must be a string');
				});
			});

			after(async () => {
				await Reply.deleteMany({ threadId });
				await Thread.findByIdAndDelete(threadId);
			});
		}
	);

	suite(
		'Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password',
		() => {
			let threadId = '',
				replyId = '';
			before(async () => {
				const postThreadRequest = {
					text: 'test_text',
					password: 'test_password',
					boardId: '6297931c1ca9bf53ea1709c7'
				};
				const thread = await Thread.create(postThreadRequest);
				threadId = thread._id;
				const postReplyRequest = {
					text: 'reply_text',
					password: 'test_password',
					threadId
				};
				const reply = await Reply.create(postReplyRequest);
				replyId = reply._id;
			});

			test('delete /api/replies', async () => {
				const request = {
					thread_id: threadId,
					reply_id: replyId,
					delete_password: 'incorrect-password'
				};
				const res = await chai
					.request(server)
					.delete(repliesRoute)
					.send(request);
				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'text/html', 'response must be text');
				assert.equal(
					res.text,
					MESSAGE.INCORRECT_PASSWORD,
					`response must be ${MESSAGE.INCORRECT_PASSWORD}`
				);
			});

			after(async () => {
				await Reply.findByIdAndDelete(replyId);
				await Thread.findByIdAndDelete(threadId);
			});
		}
	);

	suite(
		'Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password',
		done => {
			let threadId = '',
				replyId = '';
			const password = 'test_password';
			before(async () => {
				const postThreadRequest = {
					text: 'test_text',
					password: 'test_password',
					boardId: '6297931c1ca9bf53ea1709c7'
				};
				const thread = await Thread.create(postThreadRequest);
				threadId = thread._id;
				const salt = await bcrypt.genSalt(10);
				const hash = await bcrypt.hash(password, salt);
				const postReplyRequest = {
					text: 'reply_text',
					password: hash,
					threadId
				};
				const reply = await Reply.create(postReplyRequest);
				replyId = reply._id;
			});

			test('delete /api/replies', async () => {
				const request = {
					thread_id: threadId,
					reply_id: replyId,
					delete_password: password
				};
				const res = await chai
					.request(server)
					.delete(repliesRoute)
					.send(request);

				assert.equal(res.status, 200, 'must be a successful request');
				assert.equal(res.type, 'text/html', 'response must be text');
				assert.equal(
					res.text,
					MESSAGE.SUCCESS,
					`response must be ${MESSAGE.SUCCESS}`
				);
			});

			after(async () => {
				await Reply.findByIdAndDelete(replyId);
				await Thread.findByIdAndDelete(threadId);
			});
		}
	);

	suite('Reporting a reply: PUT request to /api/replies/{board}', () => {
		let threadId = '',
			replyId = '';
		before(async () => {
			const postThreadRequest = {
				text: 'test_text',
				password: 'test_password',
				boardId: '6297931c1ca9bf53ea1709c7'
			};
			const thread = await Thread.create(postThreadRequest);
			threadId = thread._id;
			const postReplyRequest = {
				text: 'reply_text',
				password: 'test_password',
				threadId
			};
			const reply = await Reply.create(postReplyRequest);
			replyId = reply._id;
		});

		test('put /api/replies', async () => {
			const request = {
				thread_id: threadId,
				reply_id: replyId
			};
			const res = await chai
				.request(server)
				.put(repliesRoute)
				.send(request);
			assert.equal(res.status, 200, 'must be a successful request');
			assert.equal(res.type, 'text/html', 'response must be text');
			assert.equal(
				res.text,
				MESSAGE.REPORTED,
				`response must be ${MESSAGE.REPORTED}`
			);
		});

		after(async () => {
			await Reply.findByIdAndDelete(replyId);
			await Thread.findByIdAndDelete(threadId);
		});
	});
});
