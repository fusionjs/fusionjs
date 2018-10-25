ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /create-fusion-plugin

COPY package.json yarn.lock /create-fusion-plugin/

RUN yarn

COPY templates/plugin/content/package.json templates/plugin/content/yarn.lock /create-fusion-plugin/templates/plugin/content/

RUN cd templates/plugin/content && yarn --ignore-scripts
