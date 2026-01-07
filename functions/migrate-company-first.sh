#!/bin/bash

# Company-First Storage Migration Script
# Target Company: 000c0911-58b3-4c80-84bc-fe015eec1961

COMPANY_ID="000c0911-58b3-4c80-84bc-fe015eec1961"
BUCKET="gs://iuppy-app.firebasestorage.app"

echo "🔄 Migrating to company-first structure"
echo "Company ID: $COMPANY_ID"
echo ""

# 1. Migrate journeys videos
echo "📹 Migrating journeys videos..."
echo "   From: $BUCKET/journeys/*"
echo "   To:   $BUCKET/$COMPANY_ID/journeys/steps/*"

gsutil -m cp -r "$BUCKET/journeys/" "$BUCKET/$COMPANY_ID/journeys/steps/" 2>&1 | grep -v "CommandException" || true

echo "   ✓ Journeys migrated"
echo ""

# 2. Migrate chat files
echo "💬 Migrating chat files..."
if gsutil ls "$BUCKET/chat_files/" &>/dev/null; then
    gsutil -m cp -r "$BUCKET/chat_files/" "$BUCKET/$COMPANY_ID/chat_files/" 2>&1 | grep -v "CommandException" || true
    echo "   ✓ Chat files migrated"
else
    echo "   ℹ No chat files found"
fi
echo ""

# 3. Migrate forms
echo "📝 Migrating forms..."
if gsutil ls "$BUCKET/forms/" &>/dev/null; then
    gsutil -m cp -r "$BUCKET/forms/" "$BUCKET/$COMPANY_ID/forms/" 2>&1 | grep -v "CommandException" || true
    echo "   ✓ Forms migrated"
else
    echo "   ℹ No forms found"
fi
echo ""

# 4. List what was created
echo "📊 Verifying new structure..."
gsutil ls -r "$BUCKET/$COMPANY_ID/" | head -20
echo ""

# 5. Ask before cleanup
echo "⚠️  Ready to delete old test data?"
echo "   - steps/"
echo "   - journeys/"
echo ""
read -p "Delete old data? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
    echo ""
    echo "🗑️  Deleting old test data..."
    
    # Delete steps
    if gsutil ls "$BUCKET/steps/" &>/dev/null; then
        gsutil -m rm -r "$BUCKET/steps/" 2>&1 | grep -v "CommandException" || true
        echo "   ✓ Deleted steps/"
    fi
    
    # Delete journeys
    if gsutil ls "$BUCKET/journeys/" &>/dev/null; then
        gsutil -m rm -r "$BUCKET/journeys/" 2>&1 | grep -v "CommandException" || true
        echo "   ✓ Deleted journeys/"
    fi
    
    echo ""
    echo "✅ Cleanup complete!"
else
    echo ""
    echo "ℹ️  Skipped cleanup. Old data remains in:"
    echo "   - $BUCKET/steps/"
    echo "   - $BUCKET/journeys/"
fi

echo ""
echo "=========================================="
echo "✅ Migration Complete!"
echo "=========================================="
echo ""
echo "New structure:"
echo "  $BUCKET/$COMPANY_ID/"
echo "    └── journeys/steps/..."
echo "    └── chat_files/..."
echo "    └── forms/..."
echo ""
