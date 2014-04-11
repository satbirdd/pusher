var nohm = require('nohm').Nohm;

var Message = nohm.model('Message', {
  properties: {
    time: {
      type: 'timestamp',
      index: true,
      // defaultValue: function() { return new Date().getTime(); },
      validations: [
        ['notEmpty']
      ]
    },
    user: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },
    group_id: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },
    text: {
      type: 'string'
    },
    attachs: {
      type: 'json'
    }
  }
});

exports.Message = Message