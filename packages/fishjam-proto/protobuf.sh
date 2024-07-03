#!/bin/sh

set -e

ROOTDIR=$(dirname "$(readlink -f $0)")

cd $ROOTDIR

printf "Synchronising submodules... "
git submodule sync --recursive >> /dev/null
git submodule update --recursive --remote --init >> /dev/null
printf "DONE\n"

file="./protos/fishjam/server_notifications.proto"

printf "Compiling file $file... \n"
protoc --plugin=./node_modules/.bin/ts_proto --ts_proto_out=./ $file
printf "DONE\n"
