var NohmUser = require('./nohm_implement').NohmUser
  , NohmMember = require('../channel/nohm_member').NohmMember
  , Channel = require('../channel').Channel
  , Message = require('../message').Message
  , _ = require('underscore')
  , async = require('async');

function Agent(id, login, Implement) {
	if (!Implement) {
		Implement = NohmUser;
	}

	Agent.Implement = Implement;
	var user = this.user = new Implement();
	user.p('id', id);
	user.p('login', login);
}

Agent.prototype.getId = function() {
	return this.user && (this.user.p instanceof Function) && this.user.p('id');
}

Agent.prototype.getLogin = function() {
	return this.user && (this.user.p instanceof Function) && this.user.p('login');
}

Agent.prototype.getToken = function() {
	return this.user && (this.user.p instanceof Function) && this.user.p('token');
}

Agent.prototype.save = function(callback) {
	var self = this;

	this.user.save(function(err, errModelName, errMsg) {
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
	this.user.remove(callback);
}

Agent.prototype.resetToken = function(callback) {
	this.user.resetToken(callback);
}

Agent.prototype.clearToken = function(callback) {
	this.user.clearToken(callback);
}

Agent.prototype.getChannels = function(callback, MemberImplement) {
	if (!MemberImplement) {
		MemberImplement = NohmMember;
	}

	MemberImplement.findAndLoad({ user_id: this.getId() },
		function(err, members) {
			var channelIds = members.map(function(member) {
				return member.p('channel_id');
			})

			async.map(channelIds, Channel.find, function(err, channels) {
				callback(err, channels);
			})
		})
}

Agent.prototype.isMyFriend = function() {}

Agent.prototype.eachChannelReadTime = function(callback, MemberImplement) {
	if (!MemberImplement) {
		MemberImplement = NohmMember;
	}

	var userId = this.getId()
	  , readTimeOptions;

	MemberImplement.findAndLoad({ userId: userId }, function(err, members) {
		readTimeOptions = members.map(function(member) {
			return {
				time: member.p('readTime'),
				channelId: member.p('channelId')
			};
		})

		callback(err, readTimeOptions);
	})
}

Agent.prototype.countUnread = function(callback) {
	var self = this
	  , userLogin = this.getLogin()
	  , groupReadTimes = void 0
	  , results = {};

	this.eachChannelReadTime(function(err, readTimeOptions) {
		async.map(readTimeOptions, getCount, function(err, returneds) {
			returneds.forEach(function(returned) {
				_.extend(results, returned);
			})
			callback(err, results);
		})

		function getCount (readTimeOption, callback) {
			Message.count({
				channelId: readTimeOption.channelId,
				time: {
					min: readTimeOption.time,
					max: '+inf'
				}
			}, function(err, size) {
				callback(err, size);
			})
		}
	});
}

Agent.wrap = function(nohmUser) {
	if (nohmUser instanceof Agent.Implement.klass) {
		var agent = new Agent();
		agent.user = nohmUser;
		return agent;
	} else {
		throw "wrong params, nohm user needed!";
	}
}

Agent.find = function(id, callback, Implement) {
	if (!Implement && !Agent.Implement) {
		Agent.Implement = Implement = NohmUser;
	} else if(!Implement) {
		Implement = Agent.Implement
	}

	Implement.findAndLoad({ id: id.toString() }, function(err, users) {
		var user = users[0];
		if (!err && user) {
			var agent = Agent.wrap(user);
			callback(null, agent);
		} else {
			callback(err, null);
		}
	})
}

Agent.findByToken = function(token, callback, Implement) {
	if (!Implement && !Agent.Implement) {
		Agent.Implement = Implement = NohmUser;
	} else if(!Implement) {
		Implement = Agent.Implement
	}

	Implement.findAndLoad({ token: token }, function(err, users) {
		var user = users[0];
		if (!err && user) {
			agent = Agent.wrap(user);
			callback(err, agent);
		} else {
			callback(err, null);
		}
	})
}

Agent.findOrCreate = function(id, login, callback) {
	Agent.find(id, function(err, agent) {
		if (agent) {
			callback(err, agent);
		} else {
			var agent = new Agent(id, login);
			agent.save(function(err) {
				if (!err) {
					callback(null, agent);
				} else {
					callback(err, null);
				}
			})
		}
	})
}

exports.User = Agent;