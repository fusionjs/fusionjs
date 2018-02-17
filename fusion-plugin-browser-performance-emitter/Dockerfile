FROM uber/web-base-image:1.0.2@sha256:50825281ac5f6044ab318f37f57073e007afd6d2e25f91ac8a4448aa8b9f28b2

WORKDIR /fusion-plugin-browser-performance-emitter

COPY . .

RUN yarn

RUN yarn build-test
