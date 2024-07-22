# Room Manager PoC

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
