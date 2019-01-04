ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /create-fusion-plugin

COPY . . 

RUN yarn

RUN cd templates/plugin/content && yarn --ignore-scripts
