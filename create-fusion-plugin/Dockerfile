FROM uber/web-base-image:1.0.7@sha256:68237a26e7d19669786e4aedfec44903ba0ec75ea0ed3d323405d0fa5c6b9323

WORKDIR /create-fusion-plugin

COPY package.json yarn.lock /create-fusion-plugin/

RUN yarn

COPY templates/plugin/content/package.json templates/plugin/content/yarn.lock /create-fusion-plugin/templates/plugin/content/

RUN cd templates/plugin/content && yarn --ignore-scripts
