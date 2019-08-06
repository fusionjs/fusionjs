case $OSTYPE in
  msys*) FILE=bazelisk-windows-amd64.exe ;;
  darwin*) FILE=bazelisk-darwin-amd64 ;;
  linux*) FILE=bazelisk-linux-amd64 ;;
  *) FILE=bazelisk-linux-amd64 ;;
esac

VERSION=0.0.8
BAZELISK_PATH=$(dirname $0)/bazelisk

if [ ! -f $BAZELISK_PATH ]
then
  curl -L -o $BAZELISK_PATH https://github.com/bazelbuild/bazelisk/releases/download/v$VERSION/$FILE
  chmod +x $BAZELISK_PATH
fi