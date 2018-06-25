FROM uber/web-base-image:1.0.6@sha256:574510637e5f45b16fb1f487aaa5f2b8a10e3d90c1a78c80df7bb0a20d76eb89

WORKDIR /create-fusion-app

COPY package.json yarn.lock /create-fusion-app/

RUN yarn

COPY templates/basic/content/package.json templates/basic/content/yarn.lock /create-fusion-app/templates/basic/content/

RUN cd templates/basic/content && yarn --ignore-scripts
