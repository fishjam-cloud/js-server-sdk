#!/bin/sh

set -e

ROOTDIR=$(dirname "$(dirname "$(dirname "$(readlink -f $0)")")")


printf "Synchronising submodules... "
git submodule sync --recursive >> /dev/null
git submodule update --recursive --remote --init >> /dev/null
printf "DONE\n"

cd $ROOTDIR/packages/fishjam-proto/protos

files="server_notifications.proto agent_notifications.proto"

for file in $files; do
  printf "Compiling file $file... \n"
    protoc --plugin=./node_modules/.bin/ts_proto --ts_proto_out=../src "fishjam/$file"
done

printf "DONE\n"
