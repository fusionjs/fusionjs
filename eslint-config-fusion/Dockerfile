FROM uber/web-base-image:1.0.5@sha256:4e53fd9da9d710a9cee8e7c39c3d6edad110904ffc3cf7b1260b9adedd5ba518

WORKDIR /eslint-config-fusion

COPY package.json yarn.lock /eslint-config-fusion/
RUN yarn

COPY . .
