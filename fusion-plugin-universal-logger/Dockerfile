FROM uber/web-base-image:1.0.0

WORKDIR /fusion-plugin-universal-logger

COPY . .

RUN yarn

RUN yarn build-test
