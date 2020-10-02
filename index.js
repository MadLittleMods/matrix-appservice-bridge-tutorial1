'use strict';

// Usage:
// First run to generate the registration
// Don't forget to add the registration to homeserver.yaml
// node index.js -r -u "http://localhost:9000"
//
// Then run the bridge (Application service)
// node index.js -p 9000

const requestLib = require('request');
const Halley = require('halley');
const Cli = require('matrix-appservice-bridge').Cli;
const Bridge = require('matrix-appservice-bridge').Bridge; // we will use this later
const AppServiceRegistration = require('matrix-appservice-bridge').AppServiceRegistration;

const env = require('./env.json');

const endpoint = `/api/v1/rooms/${env.gitterRoomId}/chatMessages`;

let bridge;
const client = new Halley.Client(env.fayeUrl);

client.addExtension({
  outgoing: function (message, callback) {
    //console.log('outgoing', message);
    if (message.channel === '/meta/handshake') {
      if (!message.ext) {
        message.ext = {};
      }
      message.ext.token = env.gitterToken;
    }

    callback(message);
  },

  /* * /
  incoming: function(message, callback) {
    //console.log('incoming', message);
    if(message.channel === '/meta/handshake') {
      var ext = message.ext;
      var userId = ext && ext.userId;
      var username = ext && ext.context && ext.context.user && ext.context.user.username;
      resolve({ userId: userId, username: username });
    }

    callback(message);
  }
  /* */
});

client
  .subscribe(endpoint, function (message) {
    console.log('message', message);

    if (message && message.operation === 'create') {
      if (bridge) {
        const model = message && message.model;
        const username = model && model.fromUser && model.fromUser.username;
        const text = model && model.text;

        const intent = bridge.getIntent(`@gitter_${username}:my.matrix.host`);
        intent.sendText(env.matrixRoomId, text);
      }
    }
  })
  .then(() => {
    console.log('Gitter halley subscription has been acknowledged');
  })
  .catch((err) => {
    console.log('err', err);
  });

new Cli({
  registrationPath: 'gitter-registration.yaml',
  generateRegistration: function (reg, callback) {
    reg.setId(AppServiceRegistration.generateToken());
    reg.setHomeserverToken(AppServiceRegistration.generateToken());
    reg.setAppServiceToken(AppServiceRegistration.generateToken());
    reg.setSenderLocalpart('gitter-badger');
    reg.addRegexPattern('users', '@gitter_.*', true);
    callback(reg);
  },
  run: function (port, config) {
    bridge = new Bridge({
      homeserverUrl: 'http://localhost:18008',
      domain: 'localhost',
      registration: 'gitter-registration.yaml',
      controller: {
        onUserQuery: function (queriedUser) {
          return {}; // auto-provision users with no additonal data
        },

        // TODO: This part is non-working
        // We never receive any events from Matrix
        onEvent: function (request, context) {
          const event = request.getData();
          console.log('event', event);

          if (
            event.type !== 'm.room.message' ||
            !event.content ||
            event.room_id !== env.matrixRoomId
          ) {
            return;
          }

          requestLib(
            {
              method: 'POST',
              json: true,
              uri: `http://localhost:5000/api/v1/rooms/${env.gitterRoomId}/chatMessages`,
              body: {
                text: `\`${event.user_id}\`: ${event.content.body}`,
              },
            },
            function (err, res) {
              if (err) {
                console.log('HTTP Error: %s', err);
              } else {
                console.log('HTTP %s', res.statusCode);
              }
            }
          );
        },
      },
    });
    console.log('Matrix-side listening on port %s', port);
    bridge.run(port, config);
  },
}).run();
