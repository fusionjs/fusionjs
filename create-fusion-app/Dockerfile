ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /create-fusion-app

COPY package.json yarn.lock /create-fusion-app/

RUN yarn

COPY templates/basic/content/package.json templates/basic/content/yarn.lock /create-fusion-app/templates/basic/content/

RUN cd templates/basic/content && yarn --ignore-scripts
