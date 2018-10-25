ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-core

COPY . .

RUN yarn

RUN yarn build-test
