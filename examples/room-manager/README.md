# Fishjam Room Manager

## Prerequisites

- Docker

## How does it work?

Fishjam Room Manager serves the purpose of a simple backend that allows users to create and/or join Fishjam rooms.
Users must provide a room name and their username to obtain an authentication token that allows them to connect to a Fishjam instance.
Room Manager manages the room names and user names by itself by keeping the mappings in memory.

> [!WARNING]
> Room Manager is inherently insecure for ease-of-use purposes and should be used in development environments only. There are no authentication or authorization mechanisms in place.

## Running the Room Manager with Fishjam

We recommend using the provided Room Manger instance on [fishjam.io](https://fishjam.io). However, if you want to run your own instance, follow the instructions below.

## Running the Room Manager locally

1. Run the build command from **the root of the repository**:

```sh
docker build -t room-manager -f examples/room-manager/Dockerfile .
```

2. Run the following command with `{url}` and `{token}` placeholders replaced to start the Room Manager:

```sh
docker run -e FISHJAM_URL={url} -e FISHJAM_MANAGEMENT_TOKEN={token} -d -p 8000:8080 room-manager:latest
```

## API

As of now, it exposes 2 endpoints.

### /api/rooms?roomName=`room_name`&peerName=`peer_name`

Simple as that - send a plain GET request and receive an auth token.
Room Manager will search its memory for the username for the requested room and return a token.
Otherwise, it will create a new one.

