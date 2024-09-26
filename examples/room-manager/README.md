# Fishjam Room Manager

## Prerequisites

- Docker Compose (tested on Colima)
- Node (tested on v18.18.0)

## Running (in dev mode)

```sh
EXTERNAL_IP=`ifconfig | grep 192.168 | cut -d ' ' -f 2`  FISHJAM_VERSION=edge docker-compose -f docker-compose-dev.yaml up
yarn
yarn start
```

## Generate `openapi.yaml`

```sh
yarn gen:openapi
```

## How does it work?

Fishjam Room Manager serves the purpose of a simple backend that allows users to create and/or join Fishjam rooms.
Users must provide a room name and their username to obtain an authentication token that allows them to connect to a Fishjam instance.
Room Manager manages the room names and user names by itself by keeping the mappings in memory.

As of now, it exposes 3 endpoints.

### '/api/rooms/:roomName/users/:username'

Simple as that - send a plain GET request and receive an auth token.
Room Manager will search its memory for the username for the requested room and return a token.
Otherwise, it will create a new one.

### '/api/rooms/:roomName/start-recording'

Will start recording in the specified room.

> **_WARNING:_** Not implemented yet!

### '/api/rooms/webhook'

Exposes a webhook endpoint to allow the Fishjam instance to send notifications to the Room Manager.
