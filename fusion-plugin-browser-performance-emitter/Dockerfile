FROM uber/web-base-image:1.0.9@sha256:98ad970fd8dadc43ecec9909e27dc543a88d096f722d00e07e0b25047e9388bc

WORKDIR /fusion-plugin-browser-performance-emitter

COPY . .

RUN yarn

RUN yarn build-test
