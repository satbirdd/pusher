var nohm = require('nohm').Nohm;

var Member = nohm.model('Member', {
  properties: {
    role: {
      type: 'string',
      validations: [
        ['notEmpty']
      ]
    },

    userId: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },

    // user_login: {
    //   index: true,
    //   type: 'string',
    //   validations: [
    //     ['notEmpty']
    //   ]
    // },

    channelId: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },

    readTime: {
      type: 'timestamp',
      defaultValue: function() {
        return new Date().getTime();
      },
      validations: [
        ['notEmpty']
      ]
    }
  },

  methods: {
    updateReadTime: function(callback) {
      callback || (callback = function() {})

      var nowTime = new Date().getTime();

      this.p('read_time', nowTime);
      this.save(function(err) {
        callback(err, nowTime);
      })
    }
  }
});

exports.NohmMember = Member
