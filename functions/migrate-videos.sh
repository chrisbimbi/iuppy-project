#!/bin/bash

# Migration Script: Move Videos to Company-Isolated Structure
# Uses gsutil for simplicity

echo "🔄 Starting video migration..."
echo ""

# First, list all videos in old paths
echo "📁 Finding videos in old paths..."
OLD_VIDEOS=$(gsutil ls -r "gs://iuppy-app.firebasestorage.app/journeys/**/raw/*.mp4" 2>/dev/null)

if [ -z "$OLD_VIDEOS" ]; then
    echo "✅ No videos found to migrate!"
    exit 0
fi

echo "Found videos:"
echo "$OLD_VIDEOS"
echo ""

# For now, we need to know the companyId
# Since all test videos are from the same company, let's ask the user
echo "⚠️  Please provide the Company ID for these videos:"
read -p "Company ID: " COMPANY_ID

if [ -z "$COMPANY_ID" ]; then
    echo "❌ Company ID is required"
    exit 1
fi

echo ""
echo "🚀 Starting migration to companies/$COMPANY_ID/..."
echo ""

# Process each video
SUCCESS=0
FAILED=0

while IFS= read -r OLD_PATH; do
    if [ -z "$OLD_PATH" ]; then
        continue
    fi
    
    echo "📹 Processing: $OLD_PATH"
    
    # Extract stepId from: gs://bucket/journeys/{stepId}/raw/filename.mp4
    STEP_ID=$(echo "$OLD_PATH" | sed -E 's|.*journeys/([^/]+)/raw/.*|\1|')
    
    if [ -z "$STEP_ID" ]; then
        echo "  ✗ Could not extract stepId"
        ((FAILED++))
        continue
    fi
    
    # Extract filename
    FILENAME=$(basename "$OLD_PATH")
    
    # Construct new path
    NEW_PATH="gs://iuppy-app.firebasestorage.app/companies/$COMPANY_ID/steps/$STEP_ID/raw/$FILENAME"
    
    echo "  → Copying to: $NEW_PATH"
    
    # Copy file
    if gsutil cp "$OLD_PATH" "$NEW_PATH" 2>/dev/null; then
        echo "  ✓ Success"
        ((SUCCESS++))
    else
        echo "  ✗ Failed"
        ((FAILED++))
    fi
    
    echo ""
    
done <<< "$OLD_VIDEOS"

# Summary
echo "=========================================="
echo "📊 Migration Summary:"
echo "  ✅ Success: $SUCCESS"
echo "  ✗ Failed:  $FAILED"
echo "=========================================="
echo ""

if [ $SUCCESS -gt 0 ]; then
    echo "⚠️  Old files were COPIED, not moved."
    echo "   Verify the new structure works, then delete old files with:"
    echo "   gsutil -m rm -r gs://iuppy-app.firebasestorage.app/journeys/**"
fi

echo ""
echo "✅ Migration complete!"
