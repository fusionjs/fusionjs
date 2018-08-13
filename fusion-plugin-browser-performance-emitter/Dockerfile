FROM uber/web-base-image:1.0.7@sha256:68237a26e7d19669786e4aedfec44903ba0ec75ea0ed3d323405d0fa5c6b9323

WORKDIR /fusion-plugin-browser-performance-emitter

COPY . .

RUN yarn

RUN yarn build-test
