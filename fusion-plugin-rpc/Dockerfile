FROM uber/web-base-image:1.0.0

WORKDIR /fusion-plugin-rpc

COPY . .

RUN yarn

RUN yarn build-tests
