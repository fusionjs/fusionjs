ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-cli

COPY package.json yarn.lock /fusion-cli/

RUN yarn
