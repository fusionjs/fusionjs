FROM uber/web-base-image:1.0.6@sha256:574510637e5f45b16fb1f487aaa5f2b8a10e3d90c1a78c80df7bb0a20d76eb89

WORKDIR /create-fusion-plugin

COPY package.json yarn.lock /create-fusion-plugin/

RUN yarn

COPY templates/plugin/content/package.json templates/plugin/content/yarn.lock /create-fusion-plugin/templates/plugin/content/

RUN cd templates/plugin/content && yarn --ignore-scripts
