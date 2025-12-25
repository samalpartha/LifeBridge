#!/bin/bash
set -e

echo "======================================================="
echo "🚀 STARTING LIFEBRIDGE UNIFIED SMOKE TESTS"
echo "======================================================="

# 1. Backend Tests
echo ""
echo "backend: Running API Smoke/Regression Tests..."
echo "-------------------------------------------------------"
cd apps/tracker-api
# Check if venv exists, if not assume python3
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
pytest tests/test_full_regression.py
echo "✅ Backend Tests Passed!"

# 2. Frontend Tests
echo ""
echo "frontend: Running E2E Smoke Tests..."
echo "-------------------------------------------------------"
cd ../../apps/web
# We only run the critical smoke/demo flows to be fast
npx playwright test tests/smoke.spec.ts tests/demo-flow.spec.ts
echo "✅ Frontend Tests Passed!"

echo ""
echo "======================================================="
echo "🎉 ALL SYSTEMS GO: SMOKE TESTS PASSED"
echo "======================================================="
