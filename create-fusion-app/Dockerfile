FROM uber/web-base-image:1.0.7@sha256:68237a26e7d19669786e4aedfec44903ba0ec75ea0ed3d323405d0fa5c6b9323

WORKDIR /create-fusion-app

COPY package.json yarn.lock /create-fusion-app/

RUN yarn

COPY templates/basic/content/package.json templates/basic/content/yarn.lock /create-fusion-app/templates/basic/content/

RUN cd templates/basic/content && yarn --ignore-scripts
