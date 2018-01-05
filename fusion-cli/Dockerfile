FROM node:8.9.0

WORKDIR /fusion-cli

COPY package.json yarn.lock /fusion-cli/

RUN apt-get update && apt-get install -y wget --no-install-recommends \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /src/*.deb

RUN yarn
