#!/usr/bin/env bash

buildkite-agent artifact download packages.tar.gz .
tar -xzf packages.tar.gz

cd docker-cache

FILES=./*
for f in $FILES; do (
  DEP=$(basename "$f")
  NAME=$(basename "$f" .json)

  mkdir $NAME
  mv $DEP ./$NAME/package.json
); done

cd ..

# Remove last 4 lines of file since we need to add the layer caching commands first before
# we copy over the monorepo
head -n -4 Dockerfile > Dockerfile-copy
mv Dockerfile-copy Dockerfile

echo "RUN mkdir /cache" >> Dockerfile
echo "WORKDIR /cache" >> Dockerfile
echo "" >> Dockerfile

for f in ./docker-cache/*; do (
  DEP_FOLDER=$(basename "$f")
  echo "RUN mkdir /cache/$DEP_FOLDER" >> Dockerfile
  echo "WORKDIR /cache/$DEP_FOLDER" >> Dockerfile
  echo "COPY ./docker-cache/$DEP_FOLDER/package.json /cache/$DEP_FOLDER/package.json" >> Dockerfile
  echo "RUN yarn install --no-lockfile" >> Dockerfile
  echo "WORKDIR /cache" >> Dockerfile
  echo "" >> Dockerfile
); done

echo "RUN mkdir /monorepo" >> Dockerfile
echo "WORKDIR /monorepo" >> Dockerfile
echo "COPY . /monorepo/" >> Dockerfile
