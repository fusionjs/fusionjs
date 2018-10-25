ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-plugin-universal-events

COPY . .

RUN yarn

RUN yarn build-test
