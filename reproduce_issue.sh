#!/bin/bash
API_BASE="http://localhost:8000"

echo "Listing documents..."
DOCS=$(curl -s "$API_BASE/documents")
COUNT=$(echo "$DOCS" | grep -o '"id":' | wc -l)
echo "Docs count: $COUNT"

if [ "$COUNT" -eq 0 ]; then
    echo "No docs to delete."
    exit 0
fi

# Extract first ID (dirty parsing, but sufficient for debugging)
TARGET_ID=$(echo "$DOCS" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
echo "Target ID: $TARGET_ID"

echo "Deleting $TARGET_ID..."
curl -v -X DELETE "$API_BASE/documents/$TARGET_ID"

echo -e "\nListing documents again..."
DOCS_AFTER=$(curl -s "$API_BASE/documents")
FOUND=$(echo "$DOCS_AFTER" | grep "$TARGET_ID")

if [ -n "$FOUND" ]; then
    echo "FAILURE: Document $TARGET_ID resurfaced!"
else
    echo "SUCCESS: Document remained deleted."
fi
