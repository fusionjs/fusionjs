FROM node:8.9.4@sha256:6054aa20c5b7d198524d9bd56c7b2d4fde046b6825e8261ccbf441444a5f4d39

WORKDIR /fusion-plugin-browser-performance-emitter

# Install electron dependencies.
ENV DISPLAY :99
ADD .buildkite/xvfb_init /etc/init.d/xvfb
ADD .buildkite/xvfb_daemon_run /usr/bin/xvfb-daemon-run

RUN dpkg --add-architecture i386
RUN apt-get update
RUN apt-get -y install libgtk2.0-dev libx11-xcb-dev libgtkextra-dev libgconf2-dev libnss3 libasound2 libxtst-dev libxss1 xvfb && \
	chmod a+x /etc/init.d/xvfb /usr/bin/xvfb-daemon-run

COPY . .

RUN yarn

RUN yarn build-test
