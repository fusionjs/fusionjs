FROM uber/web-base-image:12.13.0

RUN yarn global add jazelle@0.0.0-canary.eea8cca.0

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/
