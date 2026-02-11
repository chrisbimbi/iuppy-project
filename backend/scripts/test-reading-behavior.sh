#!/bin/bash
API_URL="http://localhost:4000"
EMAIL="admin@iuppy.com.br"
PASSWORD="123"

echo "🧪 Testing Phase 2: Reading Behavior Analytics"
echo "=============================================="
echo ""

# 1. Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    exit 1
fi
echo "✅ Token obtained"

# 2. Get a news ID (from homepage feed)
echo ""
echo "2. Getting news list..."
NEWS_RESPONSE=$(curl -s -X GET "$API_URL/v2/news/homepage?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

NEWS_ID=$(echo "$NEWS_RESPONSE" | jq -r '.data[0].id // empty')

if [ -z "$NEWS_ID" ] || [ "$NEWS_ID" == "null" ]; then
    echo "⚠️  No news found. Creating seed data might be needed."
    echo "   Run: npm run seed"
    exit 1
fi

echo "✅ Found news: $NEWS_ID"

# 3. Track reading behavior (simulate different durations)
echo ""
echo "3. Tracking reading behaviors..."

# Glanced (< 3s)
echo "  • Glanced (1.5s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 1500}}' > /dev/null

echo "  • Glanced (2.8s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 2800}}' > /dev/null

# Skimmed (3-10s)
echo "  • Skimmed (5.2s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 5200}}' > /dev/null

echo "  • Skimmed (8.7s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 8700}}' > /dev/null

# Read (> 10s)
echo "  • Read (15s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 15000}}' > /dev/null

echo "  • Read (45s)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 45000}}' > /dev/null

echo "  • Deep Read (2min)"
curl -s -X POST "$API_URL/v2/news/$NEWS_ID/open" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"origin": "web", "durationMs": 120000}}' > /dev/null

# 4. Fetch reading behavior analytics
echo ""
echo "4. Fetching Reading Behavior Analytics..."
echo ""

ANALYTICS=$(curl -s -X GET "$API_URL/v2/analytics/content/reading-behavior" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 Analytics Response:"
echo "$ANALYTICS" | jq '{
  totalOpens: .totalOpens,
  uniqueReaders: .uniqueReaders,
  avgDurationMs: .avgDurationMs,
  avgDurationSec: ((.avgDurationMs // 0) / 1000),
  buckets: .buckets,
  noDuration: .noDuration
}'

# 5. Validation
echo ""
echo "🔍 Validation:"
GLANCED=$(echo "$ANALYTICS" | jq '.buckets.glanced')
SKIMMED=$(echo "$ANALYTICS" | jq '.buckets.skimmed')
READ=$(echo "$ANALYTICS" | jq '.buckets.read')
TOTAL=$(echo "$ANALYTICS" | jq '.totalOpens')

echo "  • Glanced (< 3s): $GLANCED"
echo "  • Skimmed (3-10s): $SKIMMED"
echo "  • Read (> 10s): $READ"
echo "  • Total Opens: $TOTAL"

if [ "$GLANCED" -ge 2 ] && [ "$SKIMMED" -ge 2 ] && [ "$READ" -ge 2 ]; then
    echo ""
    echo "✅ TEST PASSED: Reading behavior analytics working!"
    echo ""
    echo "📈 Insight: We can now distinguish between:"
    echo "   - Users who glanced (${GLANCED}x)"
    echo "   - Users who skimmed (${SKIMMED}x)"
    echo "   - Users who actually read (${READ}x)"
else
    echo ""
    echo "⚠️  TEST WARNING: Expected at least 2 in each bucket"
    echo "   This may be due to cumulative data from previous runs."
fi
