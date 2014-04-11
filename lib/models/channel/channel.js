var NohmChannel = require('./nohm_implement').NohmChannel
  , NohmMember = require('./nohm_member').NohmMember
  , async = require('async')
  , FRIEND_CHANNEL_CODE = 1
  , GROUP_CHANNEL_CODE = 2;

function Agent(id, name, type, Implement) {
	if (!Implement) {
		Implement = NohmChannel;
	}

	Agent.Implement = Implement;
	var channel = this.channel = new Implement();
	channel.p('id', id);
	channel.p('name', name);
	channel.p('type', type);
}

Agent.prototype.getId = function() {
	return this.channel &&
		   (this.channel.p instanceof Function) &&
		   this.channel.p('id');
}

Agent.prototype.getName = function() {
	return this.channel &&
		   (this.channel.p instanceof Function) &&
		   this.channel.p('name');
}

Agent.prototype.getType = function() {
	return this.channel &&
		   (this.channel.p instanceof Function) &&
		   this.channel.p('type');
}

Agent.prototype.getToken = function() {
	return this.channel &&
		   (this.channel.p instanceof Function) &&
		   this.channel.p('token');
}

Agent.prototype.getJoinedSocketIds = function() {
	var joinedSocketIds = this.channel.p('joinedSocketIds')
	  , onlineSocketIds = joinedSocketIds.socketIds
	  , socketIds = [].concat(onlineSocketIds);

	return socketIds;
}

Agent.prototype.clearToken = function(callback) {
	this.channel.clearToken(callback);
}

Agent.prototype.resetToken = function(callback) {
	this.channel.resetToken(callback);
}

Agent.prototype.open =
Agent.prototype.getOrcreateToken = function(callback) {
	var token = this.getToken();
	if (!!token) {
		callback(null, token);
	} else {
		this.resetToken(callback);
	}
}

Agent.prototype.save = function(callback) {
	this.channel.save(function(err, errModelName, errMsg) {
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
	this.removeAllMembers();
	this.channel.remove(callback);
}

Agent.prototype.getTitle = function(userId, callback) {

}

Agent.prototype.hasMemberOfId = function(userId, callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	var channelType = this.getType();

	if (FRIEND_CHANNEL_CODE === channelType || GROUP_CHANNEL_CODE === channelType) {
		MemberImplement.find({ channelId: this.getId(), userId: userId }, function(err, memberIds) {
			var isMember = (memberIds.length > 0);
			callback(err, isMember);
		})
	} else {
		callback(null, true);
	}
}

Agent.prototype.addMembers = function(members, callback) {
	async.map(members, this.addMember.bind(this), function(err, results) {
		callback(err, results.length);
	})
}

/*
	there are only two forms of member:
	1. a user object
	2. a object in this form { user_id: 'xxxx', role: 'owner'}, 
	   role can be igonred, and will be token as 'member'
*/
Agent.prototype.addMember = function(member, callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	var self = this
	  , role = 'member'
	  , userId = void 0;

	if (member.getLogin) {
		userId = member.getId();
	} else if (!!member.user_id) {
		userId = member.user_id;

		if (!!member.role) {
			role = member.role;
		}
	} else {
		callback('params invalid, need user or user_id!', null);
	}

	this.isMemberExsited(userId, function(err, isMember) {
		if (err) {
			callback(err, null);
		} else if (isMember) {
			callback(null, true);
		} else {
			member = new MemberImplement();
			member.p('userId', userId);
			member.p('channelId', self.getId());
			member.p('role', role);
			member.save(function(err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, true);
				}
			})
		}
	})

}

Agent.prototype.isMemberExsited = function(userId, callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	MemberImplement.find({ userId: userId, channelId: this.getId() },
		function(err, memberIds) {
			callback(err, !!memberIds.length);
		})
}

Agent.prototype.getAllMemberIds = function(callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	MemberImplement.findAndLoad({ channelId: this.getId() }, function(err, memberIds) {
		var memberUserIds = memberIds.map(function(member) {
			return member.p('userId');
		})
		callback(err, memberUserIds);
	})
}

Agent.prototype.removeMembers = function(members, callback) {
	async.map(members, this.removeMember.bind(this), function(err, results) {
		callback(err, results.length);
	})
}

Agent.prototype.removeAllMembers = function(callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	if (!callback) {
		callback = function() {};
	}

	MemberImplement.findAndLoad({ channelId: this.getId() }, function(err, members) {
		async.map(members, removeMember, function(err, results) {
			callback(err, results.length);
		})

		function removeMember(member, callback) {
			member.remove(function(err) {
				callback(err, true);
			});
		}
	})
};

/*
	there are only two forms of member:
	1. a user object
	2. a object in this form { user_id: 'xxxx' }
*/
Agent.prototype.removeMember = function(member, callback, MemberImplement) {
	if(!MemberImplement) {
		MemberImplement = NohmMember;
	}

	var userId = void 0
	  , member = void 0;

	if (member.getLogin) {
		userId = member.getId();
	} else if (!!member.user_id) {
		userId = member.user_id;
	} else {
		callback('params invalid, need user or user_id!', null);
	}

	MemberImplement.findAndLoad({ userId: userId, channelId: this.getId() },
		function(err, members) {
			var member = members[0];
			if (!err && member) {
				member.remove(function(err) {
					callback(err, true);
				})
			} else {
				callback(err, true);
			}
		})
}

Agent.prototype.addToBlacklist = function(members, callback) {
	members = [].concat(members);

	var userIds = this.pluckUserIds(members)
	  , blacklist = this.channel.p('blackList')
	  , blacklistArray = blackList.value;

	userIds = userIds.filter(function(userId) {
		return !!userId;
	})

	userIds.forEach(function(userId) {
		var idNotExsited = !~blacklistArray.indexOf(userId);
		if (idNotExsited) {
			blacklistArray.push(userId);
		}
	})

	this.channel.p('blacklist', blacklist);
	this.channel.save(callback);
}

Agent.prototype.removeFromBlacklist = function(members, callback) {
	members = [].concat(members);

	var userIds = this.pluckUserIds(members)
	  , blacklist = this.channel.p('blackList')
	  , blacklistArray = blackList.value;

	userIds = userIds.filter(function(userId) {
		return !!userId;
	})

	userIds.forEach(function(userId) {
		var idExsited = !!~blacklistArray.indexOf(userId);
		if (idNotExsited) {
			var index = blacklistArray.indexOf(userId);
			blacklistArray.splice(index, 1);
		}
	})

	this.channel.p('blacklist', blacklist);
	this.channel.save(callback);
}

Agent.prototype.pluckUserIds = function(users) {
	var userIds = users.map(function(user) {
		if (!!user.getId) {
			return user.getId();
		} else if (!!user.user_id){
			return user.user_id;
		} else if ('string' === typeof user) {
			return user;
		}
	})

	return userIds;
};

Agent.prototype.addSocketIds = function(socketIds, callback) {
	socketIds = [].concat(socketIds);

	var joinedSocketIds = this.channel.p('joinedSocketIds')
	  , onlineSocketIds = joinedSocketIds.socketIds;

	socketIds.forEach(function(socketId) {
		if (!~onlineSocketIds.indexOf(socketId)) {
			onlineSocketIds.push(socketId);
		}
	})

	this.channel.p('joinedSocketIds', joinedSocketIds);
	this.channel.save(callback);
};

Agent.prototype.removeSocketIds = function(socketIds, callback) {
	socketIds = [].concat(socketIds);

	!!callback || (callback = function() {})

	var joinedSocketIds = this.channel.p('joinedSocketIds')
	  , onlineSocketIds = joinedSocketIds.socketIds;

	socketIds.forEach(function(socketId) {
		var index = onlineSocketIds.indexOf(socketId);
		if (!!~index) {
			onlineSocketIds.splice(index, 1);
		}
	})

	this.channel.p('joinedSocketIds', joinedSocketIds);
	if (0 === onlineSocketIds.length) {
		this.channel.p('token', '');
	}
	this.channel.save(callback);
};

Agent.prototype.removeAllSocketIds = function(callback) {
	var joinedSocketIds = this.channel.p('joinedSocketIds');

	joinedSocketIds.socketIds = [];
	this.channel.p('joinedSocketIds', joinedSocketIds);

	this.channel.save(callback);
};

Agent.prototype.setMemberReadTime = function(userId, callback, MemberImplement) {
	if (!MemberImplement) {
		MemberImplement = NohmMember;
	}

	var nowTime = new Date().getTime();

	MemberImplement.findAndLoad({ userId: userId, channelId: this.getId() },
		function(err, members) {
			members.forEach(function(member) {
				member.updateReadTime()
			})
		})

	callback(null, null);
};

Agent.wrap = function(nohmChannel) {
	if (nohmChannel instanceof Agent.Implement.klass) {
		var agent = new Agent();
		agent.channel = nohmChannel;
		return agent;
	} else {
		throw "wrong params, nohm channel needed!";
	}
}

Agent.find = function(id, callback, Implement) {
	if (!Implement && !Agent.Implement) {
		Agent.Implement = Implement = NohmChannel;
	} else if(!Implement) {
		Implement = Agent.Implement;
	}

	Implement.findAndLoad({ id: id.toString() }, function(err, channels) {
		var channel = channels[0];
		if (!err && channel) {
			var agent = Agent.wrap(channel);
			callback(null, agent);
		} else {
			callback(err, null);
		}
	})
}

Agent.findByToken = function(token, callback, Implement) {
	if (!Implement && !Agent.Implement) {
		Agent.Implement = Implement = NohmChannel;
	} else if(!Implement) {
		Implement = Agent.Implement;
	}

	Implement.findAndLoad({ token: token }, function(err, channels) {
		var channel = channels[0];
		if (!err && channel) {
			var agent = Agent.wrap(channel);
			callback(null, agent);
		} else {
			callback(err, null);
		}
	})
}

Agent.all = function(callback, Implement) {
	if (!Implement && !Agent.Implement) {
		Agent.Implement = Implement = NohmChannel;
	} else if(!Implement) {
		Implement = Agent.Implement;
	}

	Implement.find(function(err, channelIds) {
		async.map(channelIds, loadChannel, function(err, channels) {
			channels = [].concat(channels);

			channels = channels.filter(function(channel) {
				return !!channel
			})

			agents = channels.map(Agent.wrap)
			agents = [].concat(agents);
			callback(err, agents);
		})
	})

	function loadChannel(channelId, innerCallback) {
		Implement.load(channelId, function(err, attrs) {
			if (!err) {
				innerCallback(null, this);
			} else {
				innerCallback(null, null);
			}
		})
	}
}

Agent.findOrCreate = function(id, name, type, callback) {
	id = id.toString();

	Agent.find(id, function(err, agent) {
		if (agent) {
			callback(err, agent);
		} else {
			var agent = new Agent(id, name, type);
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

exports.Channel = Agent;