FROM uber/web-base-image:1.0.8@sha256:c20637d449fa8604874e588780a6800dd05cc83028fae14c45a05186402607e5

WORKDIR /create-fusion-app

COPY package.json yarn.lock /create-fusion-app/

RUN yarn

COPY templates/basic/content/package.json templates/basic/content/yarn.lock /create-fusion-app/templates/basic/content/

RUN cd templates/basic/content && yarn --ignore-scripts
