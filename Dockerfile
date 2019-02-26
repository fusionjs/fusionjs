FROM uber/web-base-image:10.15.2

ARG UNPM_TOKEN

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/

RUN node common/scripts/install-run-rush update && \
    node scripts/fix-symlinks && \
    node common/scripts/install-run-rush build
