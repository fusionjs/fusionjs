FROM uber/web-base-image:1.0.0@sha256:ae4686cb70626cfa94bc06825deea7d23ef904214d82b06d5a7e5365e60a3311

WORKDIR /eslint-config-fusion

COPY package.json yarn.lock /eslint-config-fusion/
RUN yarn

COPY . .
