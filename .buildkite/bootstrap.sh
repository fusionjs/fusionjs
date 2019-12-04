echo "steps:"
echo "  - wait"

SHA1="HEAD"
if [ "$BUILDKITE_PULL_REQUEST" = "false" ]; then
  # master commits compare HEAD with HEAD~1
  SHA2="HEAD~1"
else
  # pull requests compare HEAD with latest master
  SHA2="origin/master"
fi

# Get the change set
git diff-tree --no-commit-id --name-only -r $SHA1 $SHA2 | grep -v "\.md$" > changes.txt
CHANGES=$(jazelle changes ./changes.txt)

for DIR in $CHANGES ; do (
  PROJECT=$(basename "$DIR");
  if [ -d "$DIR" ] && [ $PROJECT != "common" ] && [ $PROJECT != "scripts" ] && [ $PROJECT != "flow-typed" ] && [ $PROJECT != "rfcs" ] && [ $PROJECT != "docs" ]; then
    if [ $PROJECT = "fusion-cli" ]; then
      echo "  - label: 'fusion-cli'";
      echo "    commands:";
      echo "    - 'cd fusion-cli'";
      echo "    - 'jazelle ci'";
      echo "    - 'jazelle build'";
      echo "    - '.buildkite/nodeTests'";
      echo "    parallelism: 10";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        pull_retries: 5";
      echo "    agents:";
      echo "      queue: workers";
      echo "  - label: 'fusion-cli lint flow'";
      echo "    commands:";
      echo "    - 'jazelle ci --cwd=$DIR'";
      echo "    - 'jazelle build --cwd=$DIR'";
      echo "    - 'jazelle lint --cwd=$DIR'";
      echo "    - 'jazelle flow --cwd=$DIR'";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        pull_retries: 5";
      echo "    agents:";
      echo "      queue: workers";
    else
      echo "  - label: '$PROJECT'";
      echo "    commands:";
      echo "    - 'jazelle ci --cwd=$DIR'";
      echo "    - 'jazelle build --cwd=$DIR'";
      echo "    - 'jazelle test --cwd=$DIR'";
      echo "    - 'jazelle lint --cwd=$DIR'";
      echo "    - 'jazelle flow --cwd=$DIR'";
      echo "    timeout_in_minutes: 10";
      echo "    plugins:";
      echo "      'docker-compose#v3.0.0':";
      echo "        run: ci";
      echo "        pull_retries: 5";
      echo "    agents:";
      echo "      queue: workers";
    fi;
  fi;
); done;
