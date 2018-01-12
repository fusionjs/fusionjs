FROM uber/web-base-image:1.0.1@sha256:ea70c0bee82985cb703b826f9b3e3e9c882f791515749510a7c83977a447d693

WORKDIR /fusion-plugin-i18n-react

COPY . .

RUN yarn

RUN yarn build-test
