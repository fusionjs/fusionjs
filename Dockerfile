FROM uber/web-base-image:10.15.2

RUN mkdir /monorepo
WORKDIR /monorepo
COPY . /monorepo/

ARG BUILDKITE_BRANCH
ARG BUILDKITE_MESSAGE
ARG BUILDKITE_REPO
ARG GH_EMAIL
ARG GH_TOKEN
ARG GH_USERNAME

RUN node common/scripts/configure-buildkite-git.js && \
  node common/scripts/rush-install-or-update && \
  node common/scripts/install-run-rush build
