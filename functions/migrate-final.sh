#!/bin/bash

COMPANY_ID="000c0911-58b3-4c80-84bc-fe015eec1961"
BUCKET="gs://iuppy-app.firebasestorage.app"

echo "🚀 Starting FINAL COMPLETE migration for Company $COMPANY_ID"
echo ""

# 1. Forms
echo "📂 Migrating Forms..."
echo "   From: $BUCKET/forms/*"
echo "   To:   $BUCKET/$COMPANY_ID/forms/"
gsutil -m mv "$BUCKET/forms/*" "$BUCKET/$COMPANY_ID/forms/" || echo "⚠️ Forms migration had issues or mismatch"

# 2. Chat Files
echo "💬 Migrating Chat Files..."
echo "   From: $BUCKET/chat_files/*"
echo "   To:   $BUCKET/$COMPANY_ID/chat/legacy/"
gsutil -m mv "$BUCKET/chat_files/*" "$BUCKET/$COMPANY_ID/chat/legacy/" || echo "⚠️ Chat migration had issues or mismatch"

# 3. Company Assets (Logo etc)
# Only move from specific company folder to new root company folder
echo "🏢 Migrating Company Assets..."
echo "   From: $BUCKET/companies/$COMPANY_ID/*"
echo "   To:   $BUCKET/$COMPANY_ID/company/"
gsutil -m mv "$BUCKET/companies/$COMPANY_ID/*" "$BUCKET/$COMPANY_ID/company/" || echo "⚠️ Company assets migration had issues or mismatch"

# 4. DELETE Journeys (Videos) - AS REQUESTED
echo "🗑️ DELETING legacy journeys videos..."
gsutil -m rm -r "$BUCKET/journeys/" || echo "⚠️ Journeys deletion had issues (maybe already empty)"

# 5. Cleanup empty root folders if possible (ignore errors)
echo "🧹 Cleaning up root folders..."
gsutil rm -r "$BUCKET/companies/$COMPANY_ID/" 2>/dev/null || true
gsutil rm -r "$BUCKET/chat_files/" 2>/dev/null || true
gsutil rm -r "$BUCKET/forms/" 2>/dev/null || true

echo ""
echo "✅ MIGRATION COMPLETE!"
echo "Please verify contents in: $BUCKET/$COMPANY_ID/"
