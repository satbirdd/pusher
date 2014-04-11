var nohm = require('nohm').Nohm;


var Member = nohm.model('Member', {
  properties: {
    role: {
      type: 'string',
      index: true,
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

    groupId: {
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
      var nowTime = new Date().getTime();
      this.p('read_time', nowTime);
      this.save(function(err) {
        callback(err, nowTime);
      })
    }
  }
});

exports.Member = Member
