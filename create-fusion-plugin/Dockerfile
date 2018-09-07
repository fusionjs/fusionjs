FROM uber/web-base-image:1.0.8@sha256:c20637d449fa8604874e588780a6800dd05cc83028fae14c45a05186402607e5

WORKDIR /create-fusion-plugin

COPY package.json yarn.lock /create-fusion-plugin/

RUN yarn

COPY templates/plugin/content/package.json templates/plugin/content/yarn.lock /create-fusion-plugin/templates/plugin/content/

RUN cd templates/plugin/content && yarn --ignore-scripts
