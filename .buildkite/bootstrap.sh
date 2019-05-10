echo "steps:"
echo "  - wait"

for d in */ ; do (
  PROJECT=$(basename "$d");
  if [ -d "$d" ] && [ $PROJECT != "common" ] && [ $PROJECT != "scripts" ] && [ $PROJECT != "flow-typed" ] && [ $PROJECT != "rfcs" ]; then
    if [ $PROJECT = "fusion-cli" ]; then
      echo "  - label: fusion-cli";
      echo "    command: cd fusion-cli && .buildkite/nodeTests";
      echo "    parallelism: 10";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        env:";
      echo "          - UNPM_TOKEN";
      echo "    agents:";
      echo "      queue: workers";
    elif [ $PROJECT = "create-fusion-app" ]; then
      echo "  - label: create-fusion-app"
      echo "    command: node common/scripts/install-run-rush.js test -t create-fusion-app";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        env:";
      echo "          - UNPM_TOKEN";
      echo "    agents:";
      echo "      queue: workers";
    else
      echo "  - label: $PROJECT";
      echo "    command: cd $PROJECT && ../common/temp/yarn-local/node_modules/.bin/yarn test";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        env:";
      echo "          - UNPM_TOKEN";
      echo "    agents:";
      echo "      queue: workers";
    fi;
  fi;
); done;

echo "  - label: ':eslint:'";
echo "    command: node common/scripts/install-run-rush lint";
echo "    timeout_in_minutes: 5";
echo "    plugins:";
echo "      'docker-compose#v3.0.0':";
echo "        run: ci";
echo "    agents:";
echo "      queue: builders";
echo "  - label: ':flowtype:'";
echo "    command: node common/scripts/install-run-rush flow";
echo "    timeout_in_minutes: 5";
echo "    plugins:";
echo "      'docker-compose#v3.0.0':";
echo "        run: ci";
echo "    agents:";
echo "      queue: workers";
