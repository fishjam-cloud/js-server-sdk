# NOTE: This Dockerfile needs to be built from the context of root of the repository
FROM node:21

# Step 1: Install SDK
WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --immutable 

COPY . .

RUN yarn workspace @fishjam-cloud/js-server-sdk build

# Step 2: Install and run the example
WORKDIR /app/examples/room-manager

RUN yarn --immutable

CMD ["yarn", "start"]