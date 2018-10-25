ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-plugin-react-router

COPY . .

RUN yarn

RUN yarn build-test
