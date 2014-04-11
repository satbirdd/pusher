var nohm = require('nohm').Nohm;

var Message = nohm.model('Message', {
  properties: {

    time: {
      type: 'timestamp',
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

    channelId: {
      type: 'string',
      index: true,
      validations: [
        ['notEmpty']
      ]
    },

    text: {
      type: 'string'
    },

    attaches: {
      type: 'json',
      defaultValue: { value: [] }
    }
  }
});

Message.klass = nohm;
exports.NohmMessage = Message;