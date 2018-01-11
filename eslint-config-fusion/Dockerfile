FROM uber/web-base-image:1.0.0

WORKDIR /eslint-config-fusion

COPY package.json yarn.lock /eslint-config-fusion/
RUN yarn

COPY . .
