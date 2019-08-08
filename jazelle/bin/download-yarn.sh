YARN_PATH=$(dirname $0)/yarn.js
VERSION=1.16.0

if [ ! -f $YARN_PATH ]
then
  curl -L -o $YARN_PATH https://github.com/yarnpkg/yarn/releases/download/v$VERSION/yarn-$VERSION.js
  chmod +x $YARN_PATH
fi