var nohm = require('nohm').Nohm
  , uuid = require('node-uuid');

var Channel = nohm.model('Channel', {
  properties: {
    id: {
      unique: true,
      type: 'string',
      validations: [
        ['notEmpty']
      ]
    },

    name: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },

    type: {
      type: 'integer',
      validations: [
        ['notEmpty']
      ]
    },

    token: {
      type: 'string',
      index: true
    },

    blacklist: {
      type: 'json',
      defaultValue: { value: [] },
      validations: [
        ['notEmpty']
      ]
    },

    joinedSocketIds: {
      type: 'json',
      defaultValue: { socketIds: [] },
      validations: [
        ['notEmpty']
      ]
    }
  },
  methods: {
    resetToken: function(callback) {
      var self = this
        , token = uuid.v1();

      this.p('token', token);

      this.save(function(err) {
        if (err) {
          callback(err, null);
        } else {
          callback(err, self.p('token'));
        }
      })
    },

    clearToken: function(callback) {
      var self = this;

      this.p('token', '');
      this.save(callback);
    },
  //   addMember: function(user, role) {

  //     var member = new Member(),
  //         self = this;

  //     if (typeof role === 'function') {
  //       cb = role;
  //       role = null;
  //     }

  //     if (role == null || role == '') {
  //       role = 'Member';
  //     }

  //     member.p('role', role);
  //     member.p('user_id', user.id);
  //     member.p('user_login', user.p('login'));
  //     member.p('group_id', this.id);
  //     self.link(member, { name: 'members' });

  //     return member;
  //   },

  //   addMembers: function(users) {
  //     var self = this;
  //     users.forEach(function(user) {
  //       if('string' === typeof(user)) {
  //         User.findAndLoad({ login: user }, function(err, users) {
  //           var the_user = users[0];
  //           if (the_user) {
  //             var member = self.addMember(the_user);
  //             self.save();
  //           }
  //         })
  //       } else {
  //         self.addMember(user)
  //         self.save();
  //       }
  //     })
  //   },

  //   // remove a member which's user_id is user.id
  //   // callback(err, removedMemberLength)
  //   removeMember: function(user, callback) {
  //     var self = this
  //       , group_id = this.id;

  //     // 相互关注所建立的群（频道），在一个用户退出后，两个member都会被删除，群也会被删除
  //     if (1 == this.p('type')) {
  //       self.remove(function(err) {
  //         if (err) {
  //           if (callback) callback(err, 0);
  //         } else {
  //           Member.findAndLoad({ group_id: group_id }, doRemoveMembers);
  //         }
  //       });
  //     } else {
  //       Member.findAndLoad({
  //         user_id: user.id,
  //         group_id: group_id
  //       }, doRemoveMembers)
  //     }

  //     function doRemoveMembers(err, members) {
  //       if (err) {
  //         if (callback) callback(err, 0);
  //       } else {
  //         async.map(members, remove, function(err, result) {
  //           var removedCount = result.reduce(function(sum, item) {
  //             return sum + item;
  //           });
  //           if (callback) callback(null, removedCount);
  //         });

  //         function remove(member, removeCallback) {
  //           member.remove(function(err) {
  //             if (err) {
  //               removeCallback(null, 0);
  //             } else {
  //               removeCallback(null, 1);
  //             }
  //           });
  //         }
  //       }
  //     }
  //   },

  //   listMembers: function(callback) {
  //     Member.findAndLoad({ group_id: this.id }, function(err, members) {
  //       if (callback) callback(members);
  //     })
  //   },

  //   removeMembers: function(callback) {
  //     Member.findAndLoad({ group_id: this.id }, function(err, members) {
  //       async.each(members, remove, function(err){
  //         if (callback) { callback(err); }
  //       });
  //     });

  //     var remove = function(member, removeCallback) {
  //       member.remove();
  //       if (removeCallback) { removeCallback(null); }
  //     }
  //   }
  }
});

Channel.klass = nohm;
exports.NohmChannel = Channel;