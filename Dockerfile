FROM uber/web-base-image:14.18.0-buster

RUN yarn global add jazelle@0.0.0-canary.eea8cca.0

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/
