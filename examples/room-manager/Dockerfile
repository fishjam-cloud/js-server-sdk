# NOTE: This Dockerfile needs to be built from the context of root of the repository
FROM node:22-alpine

# Step 1: Install deps
WORKDIR /app

# Required for "websocket" dependency
RUN apk add g++ make python3

RUN corepack enable

COPY . .

RUN yarn --immutable

# Step 2: Build the SDK
RUN yarn build

# Step 3: Run the example
WORKDIR /app/examples/room-manager

CMD ["yarn", "start"]
