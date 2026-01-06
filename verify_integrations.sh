#!/bin/bash

API="http://localhost:4000"
COMPANY="ACME_TEST"

# 0. Login & Get Token
echo "Logging in..."
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@iuppy.com.br","password":"123"}' | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Login Failed!"
  exit 1
fi
echo "Login Success! Token: ${TOKEN:0:10}..."

AUTH="Authorization: Bearer $TOKEN"

echo "\n=== Listing Providers ==="
curl -s "$API/integrations/providers" -H "$AUTH" | jq .

echo "\n=== Listing Connections ==="
CONNECTIONS=$(curl -s "$API/integrations/connections" -H "$AUTH")
echo "$CONNECTIONS" | jq .

# Trigger Sync if connection exists
ID=$(echo "$CONNECTIONS" | jq -r '.[0].id // empty')
if [ "$ID" != "empty" ] && [ "$ID" != "null" ]; then
    echo "\n=== Triggering Sync for $ID ==="
    curl -s -X POST "$API/integrations/sync" \
      -H 'Content-Type: application/json' \
      -H "$AUTH" \
      -d "{\"connectionId\":\"$ID\", \"type\":\"delta\"}" | jq .
else
    echo "\nNo connections found to sync."
fi
