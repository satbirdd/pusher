var nohm = require('nohm').Nohm
  , async = require('async')
  // , Member = require('./member').Member
  , uuid = require('node-uuid');

var User = nohm.model('User', {
  properties: {
    id: {
      type: 'string',
      unique: true,
      validations: [
        ['notEmpty']
      ]
    },
    login: {  // FIXME repreated data
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },
    token: {
      type: 'string',
      index: true
      // unique: true
    }
  },

  methods: {

    clearToken: function(callback) {
      this.p('token', '');
      this.save(callback);
    },

    resetToken: function(callback) {
      var token = uuid.v1();
      this.p('token', token);
      this.save(function(err) {
        if (!err) {
          callback(null, token);
        } else {
          callback(err, null);
        }
      })
    }
  }
});

User.klass = nohm;
exports.NohmUser = User;