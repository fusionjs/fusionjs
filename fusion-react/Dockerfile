FROM uber/web-base-image:1.0.0

WORKDIR /fusion-react

COPY . .

RUN yarn

RUN yarn --ignore-scripts run build-test
