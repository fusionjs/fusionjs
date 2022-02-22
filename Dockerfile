FROM uber/web-base-image:16.13.0-buster

RUN yarn global add jazelle@0.0.0-canary.eea8cca.0

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/
