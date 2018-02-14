FROM node:8.9.4@sha256:28ab0eea1772d44259687f4d540535515f64634bae5ed846a12a09d5a49456f5

WORKDIR /fusion-plugin-font-loader-react

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
