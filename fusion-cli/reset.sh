#!/bin/bash
git checkout */split2.js
echo "checked out"
pkill -f fusion-cli
echo "fusion-cli"
pkill -f jest
echo "jest"
pkill -f puppeteer
echo "puppeteer"
yarn test test/e2e/split-translations/test.js
