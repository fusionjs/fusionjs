ARG BASE_IMAGE=uber/web-base-image:2.0.0
FROM $BASE_IMAGE

WORKDIR /fusion-plugin-service-worker

COPY . .

RUN yarn

RUN yarn pack --filename fusion-plugin-service-worker.tgz

RUN cd fixture-apps/app && rm -rf node_modules && yarn

RUN yarn --ignore-scripts run build-test
