# Build stage

FROM node:alpine AS build

WORKDIR /usr/src/network

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY src/ src
COPY tsconfig.json tsconfig.json

RUN npm run build

# Final stage

FROM node:alpine

WORKDIR /usr/src/network

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci npm ci --production --only=production --no-optional

COPY --from=build /usr/src/network/build/ /usr/src/network/build/

# In order for the network container to access DBUS socket of the host rather than that of the container
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

ENTRYPOINT node /usr/src/network/build/index.js