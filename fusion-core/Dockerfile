FROM uber/web-base-image:1.0.0

WORKDIR /fusion-core

COPY . .

RUN yarn

RUN yarn build-test
