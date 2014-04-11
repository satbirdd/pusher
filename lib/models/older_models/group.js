var nohm = require('nohm').Nohm,
  Member = require('./member').Member,
  User   = require('./user').User,
  async  = require('async');

var Group = nohm.model('Group', {
  properties: {
    name: {
      type: 'string',
      unique: true,
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
    channel_id: {
      unique: true,
      type: 'string'
    }
  },
  methods: {
    /**
     *  User model instance
     *
     *  Role [string] optional
     */
    addMember: function(user, role) {

      var member = new Member(),
          self = this;

      if (typeof role === 'function') {
        cb = role;
        role = null;
      }

      if (role == null || role == '') {
        role = 'Member';
      }

      member.p('role', role);
      member.p('user_id', user.id);
      member.p('user_login', user.p('login'));
      member.p('group_id', this.id);
      self.link(member, { name: 'members' });

      return member;
    },

    addMembers: function(users) {
      var self = this;
      users.forEach(function(user) {
        if('string' === typeof(user)) {
          User.findAndLoad({ login: user }, function(err, users) {
            var the_user = users[0];
            if (the_user) {
              var member = self.addMember(the_user);
              self.save();
            }
          })
        } else {
          self.addMember(user)
          self.save();
        }
      })
    },

    // remove a member which's user_id is user.id
    // callback(err, removedMemberLength)
    removeMember: function(user, callback) {
      var self = this
        , group_id = this.id;

      // 相互关注所建立的群（频道），在一个用户退出后，两个member都会被删除，群也会被删除
      if (1 == this.p('type')) {
        self.remove(function(err) {
          if (err) {
            if (callback) callback(err, 0);
          } else {
            Member.findAndLoad({ group_id: group_id }, doRemoveMembers);
          }
        });
      } else {
        Member.findAndLoad({
          user_id: user.id,
          group_id: group_id
        }, doRemoveMembers)
      }

      function doRemoveMembers(err, members) {
        if (err) {
          if (callback) callback(err, 0);
        } else {
          async.map(members, remove, function(err, result) {
            var removedCount = result.reduce(function(sum, item) {
              return sum + item;
            });
            if (callback) callback(null, removedCount);
          });

          function remove(member, removeCallback) {
            member.remove(function(err) {
              if (err) {
                removeCallback(null, 0);
              } else {
                removeCallback(null, 1);
              }
            });
          }
        }
      }
    },

    listMembers: function(callback) {
      Member.findAndLoad({ group_id: this.id }, function(err, members) {
        if (callback) callback(members);
      })
    },

    removeMembers: function(callback) {
      Member.findAndLoad({ group_id: this.id }, function(err, members) {
        async.each(members, remove, function(err){
          if (callback) { callback(err); }
        });
      });

      var remove = function(member, removeCallback) {
        member.remove();
        if (removeCallback) { removeCallback(null); }
      }

      // var remove = function(id, cb) {
      //   var member = Member.load(id, function(){
      //     member.remove()
      //     if (cb) { cb(null); }
      //   });
      // }

      // this.getAll('Member', 'members', function(err, memberIds){
      //   async.each(memberIds, remove.bind(this), function(err){
      //     if (cb) { cb(err);}
      //   });
      // })
    }
  }
});

// Group.numLinks('User', function(err, num) {
//   console.log(num);
// })

exports.Group = Group

