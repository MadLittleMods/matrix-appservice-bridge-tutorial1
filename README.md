# Matrix appservice bridge tutorial

See https://github.com/matrix-org/matrix-appservice-bridge/blob/develop/HOWTO.md

---

Basing homeserver and Element setup off of https://zerowidthjoiner.net/2020/03/20/setting-up-matrix-and-riot-with-docker

```
docker-compose up -d --no-recreate
```

Setup homeserver, see https://hub.docker.com/r/matrixdotorg/synapse/

If on macOS/Linux, replace `%cd%` with `$(pwd)`,

```
docker run -it --rm
    --mount type=bind,src=%cd%\data,dst=/data
    -e SYNAPSE_SERVER_NAME=my.matrix.host
    -e SYNAPSE_REPORT_STATS=yes
    matrixdotorg/synapse:latest generate
```

Copy the latest `gitter-registration.yaml` to `data/`

Edit `data/homeserver.yaml` to add the registration

```
# A list of application service config files to use
#
app_service_config_files:
  - /data/gitter-registration.yaml
```

Now you can visit http://localhost:18008 to see your homeserver

Create the first test user on your homeserver

```
$ docker exec -it synapse /bin/bash

> register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008
```

Visit http://localhost:18010/ and sign in with your new user
