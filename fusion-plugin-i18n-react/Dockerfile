FROM uber/web-base-image:1.0.8@sha256:c20637d449fa8604874e588780a6800dd05cc83028fae14c45a05186402607e5

WORKDIR /fusion-plugin-i18n-react

COPY . .

RUN yarn

RUN yarn build-test
