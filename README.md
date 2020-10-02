# Matrix appservice bridge tutorial

See https://github.com/matrix-org/matrix-appservice-bridge/blob/develop/HOWTO.md

---

Setup homeserver, see https://hub.docker.com/r/matrixdotorg/synapse/

```
docker run -it --rm
    --mount type=bind,src=C:\Users\MLM\Libraries\Code\random\matrix-synapse-docker1\data,dst=/data
    -e SYNAPSE_SERVER_NAME=my.matrix.host
    -e SYNAPSE_REPORT_STATS=yes
    matrixdotorg/synapse:latest generate
```

Edit `C:\Users\MLM\Libraries\Code\random\matrix-synapse-docker1\homeserver.yaml` to add the registration

```
# A list of application service config files to use
#
app_service_config_files:
  - /data/gitter-registration.yaml
```

Start the homeserver

```
docker run -d --name synapse
    --mount type=bind,src=C:\Users\MLM\Libraries\Code\random\matrix-synapse-docker1\data,dst=/data
    -p 8008:8008
    matrixdotorg/synapse:latest
```

Now you can visit http://localhost:8008/ to see your homeserver

Create the first test user on your homeserver

```
$ docker exec -it synapse /bin/bash

> register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008
```
