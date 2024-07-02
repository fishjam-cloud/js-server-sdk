# Room Manager PoC

## Prerequisites

- Docker Compose (tested on Colima)
- Node (tested on v18.18.0)

## Running (in dev mode)

```sh
EXTERNAL_IP=`ifconfig | grep 192.168 | cut -d ' ' -f 2`  JELLYFISH_VERSION=edge docker-compose -f docker-compose-dev.yaml up
npm install
npm start
```


## Generate OpenAPI

```shell
npx @openapitools/openapi-generator-cli generate -i /path/to/openapi.yaml -g typescript-axios -o ./output/path
```
