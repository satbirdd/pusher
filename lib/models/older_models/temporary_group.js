var nohm = require('nohm').Nohm
  , Group = require('./group').Group
  , Member = require('./member').Member
  , Channel = require('./channel').Channel;

var TemporaryGroup = nohm.model('TemporaryGroup', {
  properties: {

    public_name: {
      type: 'string',
      unique: true,
      validations: [
        ['notEmpty']
      ]
    },

    group_name: {
      type: 'string',
      unique: true,
      validations: [
        ['notEmpty']
      ]
    },

    mode: {
      type: 'integer',
      validations: [
        ['notEmpty']
      ]
    },

    blacklist: {
      type: 'string',
      defaultValue: "{\"value\": []}"
    }
  },

  methods: {

    createGroup: function(){
      var group = new Group();
      group.p('name', this.p('group_name'));
      group.p('type', 3);

      this.link(group);
      return group;
    },

    removeGroup: function(callback){
      var self = this;

      this.getAll('Group', function(err, ids){
        for (var i = 0;i < ids.length ; i++) {
          var group = Group.load(ids[i], function(err, attr){
            if (group.p('type') == 3) {
              group.removeMembers(function(err){
                self.unlink(group);
                group.remove(function(err){
                  if (callback) {
                    callback(err);

                  }
                });
              });
            }
          })
        }
      });
    },

    setMode: function(mode) {
      switch(mode) {
        case "onlyMember":
          this.p('mode', 1);
          return true;
        case "invite":
          this.p('mode', 2);
          return true;
        case "any":
          this.p('mode', 3);
          return true;
        default:
          return false;
      }
    },

    doIfOwner: function(user, err, callback) {
      this.getAll('Group', function(error, groupIds) {
        var groupId = groupIds[0];
        if (groupId) {
          Member.findAndLoad({ group_id: groupId, user_login: user }, function(error, members) {
            var member = members[0];
            if (member && "Owner" == member.p('role')) {
              callback();
            } else {
              err("permission denied!! error: " + error);
            }
          })
        } else {
          err("group does not existed!!");
        }
      })
    }
  }
});


exports.TemporaryGroup = TemporaryGroup;