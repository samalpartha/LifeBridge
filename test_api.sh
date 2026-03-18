#!/bin/bash
# Refreshed for repository housekeeping on 2026-03-18.

# LifeBridge API Test Script
# Run this after starting docker compose

set -e

API_BASE="http://localhost:8000"
WEB_BASE="http://localhost:3000"

echo "🧪 Testing LifeBridge API..."
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "$API_BASE/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Create case
echo "2️⃣  Testing case creation..."
CASE_RESPONSE=$(curl -s -X POST "$API_BASE/cases" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test Case","scenario":"family_reunion"}')
CASE_ID=$(echo "$CASE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CASE_ID" ]; then
    echo "✅ Case created: $CASE_ID"
else
    echo "❌ Case creation failed"
    echo "$CASE_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Get case
echo "3️⃣  Testing case retrieval..."
CASE=$(curl -s "$API_BASE/cases/$CASE_ID")
if echo "$CASE" | grep -q "$CASE_ID"; then
    echo "✅ Case retrieved successfully"
else
    echo "❌ Case retrieval failed"
    exit 1
fi
echo ""

# Test 4: Create demo preset
echo "4️⃣  Testing demo preset..."
DEMO_RESPONSE=$(curl -s -X POST "$API_BASE/demo/preset" \
    -H "Content-Type: application/json" \
    -d '{}')
DEMO_CASE_ID=$(echo "$DEMO_RESPONSE" | grep -o '"case_id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$DEMO_CASE_ID" ]; then
    echo "✅ Demo preset created: $DEMO_CASE_ID"
else
    echo "❌ Demo preset creation failed"
    echo "$DEMO_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Get outputs
echo "5️⃣  Testing outputs retrieval..."
OUTPUTS=$(curl -s "$API_BASE/cases/$DEMO_CASE_ID/outputs")
if echo "$OUTPUTS" | grep -q "checklist"; then
    echo "✅ Outputs retrieved successfully"
    
    # Count items
    CHECKLIST_COUNT=$(echo "$OUTPUTS" | grep -o '"label":' | wc -l)
    echo "   📋 Checklist items: $CHECKLIST_COUNT"
    
    RISK_COUNT=$(echo "$OUTPUTS" | grep -o '"severity":' | wc -l)
    echo "   ⚠️  Risk items: $RISK_COUNT"
    
    CHUNK_COUNT=$(echo "$OUTPUTS" | grep -o '"text":' | wc -l)
    echo "   📄 Chunks: $CHUNK_COUNT"
else
    echo "❌ Outputs retrieval failed"
    exit 1
fi
echo ""

# Test 6: Web UI accessibility
echo "6️⃣  Testing web UI..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_BASE")
if [ "$WEB_STATUS" = "200" ]; then
    echo "✅ Web UI is accessible"
else
    echo "❌ Web UI returned status: $WEB_STATUS"
    exit 1
fi
echo ""

# Test 7: API docs
echo "7️⃣  Testing API documentation..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/docs")
if [ "$DOCS_STATUS" = "200" ]; then
    echo "✅ API docs are accessible"
else
    echo "❌ API docs returned status: $DOCS_STATUS"
    exit 1
fi
echo ""

echo "🎉 All tests passed!"
echo ""
echo "Next steps:"
echo "  • Open $WEB_BASE in your browser"
echo "  • Try the demo preset"
echo "  • Upload a document"
echo ""
echo "Useful URLs:"
echo "  • Web UI: $WEB_BASE"
echo "  • API Docs: $API_BASE/docs"
echo "  • MinIO Console: http://localhost:9001 (minio/minio12345)"

