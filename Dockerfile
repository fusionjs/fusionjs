FROM uber/web-base-image:10.15.2

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/

RUN node common/scripts/rush-install-or-update && \
  node common/scripts/install-run-rush build
