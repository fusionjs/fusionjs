FROM uber/web-base-image:10.15.2

RUN yarn global add jazelle@0.0.0-canary.34b9387.0

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/
