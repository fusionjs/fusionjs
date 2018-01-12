FROM uber/web-base-image:1.0.0@sha256:ae4686cb70626cfa94bc06825deea7d23ef904214d82b06d5a7e5365e60a3311

WORKDIR /fusion-plugin-i18n-react

COPY . .

RUN yarn

RUN yarn build-test
