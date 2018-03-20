FROM uber/web-base-image:1.0.3@sha256:735b4972c0b7fe67813edd67eeba11cca79209140a81a9387b42ac8b4c570f88

WORKDIR /fusion-core

COPY . .

RUN yarn

RUN yarn build-test
