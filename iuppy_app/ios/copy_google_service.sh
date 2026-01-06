#!/bin/sh

# Get the flavor from the scheme name (e.g. "Debug-nextsalesDev" -> "nextsales")
# Assuming scheme format: [BuildType]-[Flavor]Dev/Prod or just [Flavor]Dev/Prod

echo "🎯 Copying GoogleService-Info.plist for configuration: $CONFIGURATION"

# Default to iuppy if not found
FLAVOR="iuppy"

if [[ "$CONFIGURATION" == *"-nextsales"* ]]; then
    FLAVOR="nextsales"
elif [[ "$CONFIGURATION" == *"-iuppy"* ]]; then
    FLAVOR="iuppy"
fi

# Path to the specific config
PLIST_PATH="${PROJECT_DIR}/config/${FLAVOR}/GoogleService-Info.plist"

echo "📂 Looking for config at: $PLIST_PATH"

if [ -f "$PLIST_PATH" ]; then
    cp "$PLIST_PATH" "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app/GoogleService-Info.plist"
    echo "✅ Copied $FLAVOR GoogleService-Info.plist to app bundle."
else
    echo "⚠️ Warning: GoogleService-Info.plist not found for flavor $FLAVOR at $PLIST_PATH"
fi
