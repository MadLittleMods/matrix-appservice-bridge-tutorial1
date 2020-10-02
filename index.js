const realtimeClient = require('gitter-realtime-client');

const env = require('./env.json');

const client = new realtimeClient.RealtimeClient({
  fayeUrl: 'http://localhost:5000/bayeux',
  token: env.gitterToken,
});

client.on('connection:up', function () {
  console.log('realtime-connectivity:up');
});

client.on('connection:down', function () {
  console.log('realtime-connectivity:down');
});

LiveCollection.extend({
  //model: ChatModel,
  modelName: 'chat',
  client,

  urlTemplate: '/v1/rooms/:troupeId/chatMessages',
  contextModel: context.contextModel(),
});
