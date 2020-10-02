'use strict';

// Usage:
// First run to generate the registration
// Don't forget to add the registration to homeserver.yaml
// node index.js -r -u "http://localhost:9000"
//
// Then run the bridge (Application service)
// node index.js -p 9000

const Halley = require('halley');
const Cli = require('matrix-appservice-bridge').Cli;
const Bridge = require('matrix-appservice-bridge').Bridge; // we will use this later
const AppServiceRegistration = require('matrix-appservice-bridge').AppServiceRegistration;

const env = require('./env.json');

const endpoint = `/api/v1/rooms/${env.gitterRoomId}/chatMessages`;

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

    if (bridge) {
      const username = message && message.fromUser && message.fromUser.username;

      const intent = bridge.getIntent(`@gitter_${username}:localhost`);
      intent.sendText(env.matrixRoomId, params.text);
    }
  })
  .then(() => {
    console.log('subscription has been acknowledged');
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
      homeserverUrl: 'http://localhost:8008',
      domain: 'localhost',
      registration: 'gitter-registration.yaml',
      controller: {
        onUserQuery: function (queriedUser) {
          return {}; // auto-provision users with no additonal data
        },

        onEvent: function (request, context) {
          return; // we will handle incoming matrix requests later
        },
      },
    });
    console.log('Matrix-side listening on port %s', port);
    bridge.run(port, config);
  },
}).run();
