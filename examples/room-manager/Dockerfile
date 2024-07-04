# NOTE: This Dockerfile needs to be built from the context of root of the repository
FROM node:22-alpine

# Step 1: Install deps
WORKDIR /app

RUN corepack enable

COPY . .

RUN yarn --immutable

# Step 2: Build the SDK
RUN yarn workspace @fishjam-cloud/js-server-sdk build

# Step 3: Run the example
WORKDIR /app/examples/room-manager

CMD ["yarn", "start"]