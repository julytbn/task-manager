#!/usr/bin/env bash
# Script to call the check-late endpoint (for use with cron)
# Usage: set CHECK_LATE_SECRET env var and schedule this script

URL="http://localhost:3000/api/paiements/check-late"
SECRET="${CHECK_LATE_SECRET:-}"

if [ -z "$SECRET" ]; then
  echo "CHECK_LATE_SECRET not set. Export it before running this script."
  exit 1
fi

curl -s -X GET "$URL" -H "x-internal-secret: $SECRET" -o /tmp/check-late-result.json
if [ $? -ne 0 ]; then
  echo "Request failed"
  exit 2
fi

echo "Run finished. Output saved to /tmp/check-late-result.json"
cat /tmp/check-late-result.json
