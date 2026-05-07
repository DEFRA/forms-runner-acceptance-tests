#!/bin/sh

echo "run_id: $RUN_ID"

rm -f FAILED

npm test || touch FAILED

npm run report:publish
publish_exit_code=$?

if [ $publish_exit_code -ne 0 ]; then
  echo "failed to publish test results"
  exit $publish_exit_code
fi

# Exit with the test status after the report has been published.
if [ -f FAILED ]; then
  echo "test suite failed"
  exit 1
fi

echo "test suite passed"
exit 0
