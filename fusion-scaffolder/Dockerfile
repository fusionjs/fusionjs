ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-scaffolder

COPY package.json yarn.lock /fusion-scaffolder/

RUN yarn
