FROM uber/web-base-image:12.3.0

RUN yarn global add jazelle@0.0.0-canary.777f2cc.0

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/
