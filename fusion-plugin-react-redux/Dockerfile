FROM uber/web-base-image:1.0.0

WORKDIR /fusion-plugin-react-redux

COPY . .

RUN yarn

RUN yarn --ignore-scripts run build-test
