var NohmMessage = require('./nohm_implement').NohmMessage
  , async = require('async');

function Agent(options, Implement) {
	if (!Implement) {
		Agent.Implemen = Implement = NohmMessage;
	}

	var message = this.message = new Implement()
	  , userId = options.userId
	  , channelId = options.channelId
	  , time = options.time
	  , text = options.text
	  , attaches = [].concat(options.attachments || []);

	message.p('userId', userId);
	message.p('channelId', channelId);
	message.p('time', time);
	message.p('text', text);
	message.p('attaches', { value: attaches });
}

Agent.prototype.getUserId = function() {
	return this.message &&
		   (this.message.p instanceof Function) &&
		   this.message.p('user_id');
}

Agent.prototype.getChannelId = function() {
	return this.message &&
		   (this.message.p instanceof Function) &&
		   this.message.p('channel_id');
}

Agent.prototype.getTime = function() {
	return this.message &&
		   (this.message.p instanceof Function) &&
		   this.message.p('time');
}

Agent.prototype.getText = function() {
	return this.message &&
		   (this.message.p instanceof Function) &&
		   this.message.p('text');
}

Agent.prototype.getAttaches = function() {
	return this.message &&
		   (this.message.p instanceof Function) &&
		   this.message.p('attaches') &&
		   this.message.p('attaches')['attaches'];
}

Agent.prototype.save = function(callback) {
	var self = this;

	this.message.save(function(err, errModelName, errMsg) {
		if (err && errModelName && errMsg) {
			callback(errModelName + ": " + errMsg);
		} else if (err) {
			callback(err);
		} else {
			callback(null);
		}
	})
}

Agent.prototype.destroy = function(callback) {
	this.message.remove(callback);
}

Agent.count = function(options, callback, Implement) {
	if (!Implement) {
		Implement = NohmMessage;
	}

	Implement.find(options, function(err, replies) {
		var returned = {};

		if (replies.length > 0) {
			returned[options.channelId] = replies.length;
		}

		callback(err, returned);
	})
}

Agent.getChannelMessages = function(options, callback, Implement) {
	if (!Implement) {
		Implement = NohmMessage;
	}

	var channelId = options.channelId
	  , fetchType = options.fetchType
	  , step = options.step || 10;

	if (!fetchType || "index" == fetchType) {
		var start = options.start;
		Implement.find({ channelId: channelId }, function(err, msgIds) {
			Implement.sort({
				field: 'time',
				direction: 'DESC'
			}, msgIds, function(err, sortedIds) {
				var begin = start - 1
				  , end = start + step - 1
				  , fetchIds = sortedIds.slice(begin, end).reverse()
				  , endFlag = (sortedIds.length < step);

				async.map(fetchIds, function(msgId, callback) {
					Implement.load(msgId, function(err, attrs) {
						attrs.msg = attrs.text;
						attrs.attachments = attrs.attachs;
						delete attrs.attachs;
						delete attrs.text;
						callback(err, attrs);
					})
				}, function(err, results) {
					results.unshift(endFlag);
					console.log('*******', sortedIds, begin, end, fetchIds, results, '********');
					callback(err, results);
				})
			})
		})
	} else if ('time_step' == fetchType) {
		var startTime = options.start;
		Implement.find({
			channelId: channelId,
			time: {
				max: startTime
			}
		}, function(err, msgId) {
			Implement.sort({
				field: 'time',
				direction: 'DESC'
			}, msgId, function(err, message_ids) {
				var fetchIds = message_ids.slice(0, step).reverse()
				  , endFlag  = (message_ids.length < step);
				async.map(fetchIds, function(msgId, callback) {
					Implement.load(msgId, function(err, attrs) {
						attrs.msg = attrs.text;
						attrs.attachments = attrs.attachs;
						delete attrs.attachs;
						delete attrs.text;
						callback(err, attrs);
					})
				}, function(err, results) {
						results.unshift(endFlag);
						callback(err, results);
				})
			})
		})
	}
}

// Agent.wrap = function(nohmMessage) {
// 	if (nohmMessage instanceof Agent.Implement.klass) {
// 		var agent = new Agent();
// 		agent.message = NohmMessage;
// 		return agent;
// 	} else {
// 		throw "wrong params, nohm message needed!";
// 	}
// }

// Agent.find = function(id, callback, Implement) {
// 	if (!Implement && !Agent.Implement) {
// 		Agent.Implement = Implement = NohmUser;
// 	} else if(!Implement) {
// 		Implement = Agent.Implement
// 	}

// 	Implement.findAndLoad({ id: id.toString() }, function(err, messages) {
// 		var message = messages[0];
// 		if (!err && message) {
// 			var agent = Agent.wrap(message);
// 			callback(null, agent);
// 		} else {
// 			callback(err, null);
// 		}
// 	})
// }

// Agent.findOrCreate = function(id, name, type, callback) {
// 	Agent.find(id, function(err, agent) {
// 		if (agent) {
// 			callback(err, agent);
// 		} else {
// 			var agent = new Agent(id, name, type);
// 			agent.save(function(err) {
// 				if (!err) {
// 					callback(null, agent);
// 				} else {
// 					callback(err, null);
// 				}
// 			})
// 		}
// 	})
// }

exports.Message = Agent;