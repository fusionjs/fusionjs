FROM uber/web-base-image:1.0.7@sha256:68237a26e7d19669786e4aedfec44903ba0ec75ea0ed3d323405d0fa5c6b9323

WORKDIR /eslint-config-fusion

COPY package.json yarn.lock /eslint-config-fusion/
RUN yarn

COPY . .
