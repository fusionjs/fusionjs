FROM uber/web-base-image:1.0.6@sha256:574510637e5f45b16fb1f487aaa5f2b8a10e3d90c1a78c80df7bb0a20d76eb89

WORKDIR /fusion-plugin-i18n-react

COPY . .

RUN yarn

RUN yarn build-test
