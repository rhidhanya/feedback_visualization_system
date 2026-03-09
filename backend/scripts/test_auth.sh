#!/usr/bin/env bash
# Phase 2 API Test Script
# Starts server, runs all auth/access tests, then stops server.
set -e

BASE="http://localhost:5000/api"
PASS=0
FAIL=0

check() {
  local label=$1
  local expected=$2
  local actual=$3
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $label"
    PASS=$((PASS+1))
  else
    echo "  ❌ $label"
    echo "     Expected: $expected"
    echo "     Got:      $actual"
    FAIL=$((FAIL+1))
  fi
}

# ── Start server ────────────────────────────────────────────────────────────
cd "$(dirname "$0")"
node server.js &
SERVER_PID=$!
sleep 4

echo ""
echo "══════════════════════════════════════════"
echo "  PHASE 2 – Authentication & Access Tests"
echo "══════════════════════════════════════════"
echo ""

# ── Test 1: Health Check ─────────────────────────────────────────────────
echo "── Health ──"
R=$(curl -sf $BASE/health)
check "Health endpoint returns success" '"success":true' "$R"

# ── Test 2: Admin Login ──────────────────────────────────────────────────
echo "── Admin Login ──"
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitsathy.in","password":"admin123"}')
check "Admin login returns token" '"token"' "$R"
check "Admin role in response" '"role":"admin"' "$R"
ADMIN_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# ── Test 3: Student Login ────────────────────────────────────────────────
echo "── Student Login ──"
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya@student.edu","password":"student123"}')
check "Student login returns token" '"token"' "$R"
check "Student role in response" '"role":"student"' "$R"
STUDENT_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# ── Test 4: Wrong Password → 401 ─────────────────────────────────────────
echo "── Bad Credentials ──"
R=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitsathy.in","password":"wrongpass"}')
check "Wrong password → 401 message" 'Invalid email or password' "$R"

# ── Test 5: Validation — Missing Email ──────────────────────────────────
echo "── Input Validation ──"
R=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"","password":"pass"}')
check "Empty email → 400 validation" 'valid email' "$R"

R=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"pass"}')
check "Invalid email format → 400" 'valid email' "$R"

R=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"pass"}')
check "Missing email field → 400" 'valid email' "$R"

# ── Test 6: GET /auth/me — Valid Token ───────────────────────────────────
echo "── Protected Routes (Good token) ──"
R=$(curl -sf $BASE/auth/me -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /auth/me with admin token → success" '"success":true' "$R"
check "GET /auth/me returns name" '"name"' "$R"

# ── Test 7: No Token → 401 ───────────────────────────────────────────────
echo "── Protected Routes (No token) ──"
R=$(curl -s $BASE/auth/me)
check "No token → 401" 'No token provided' "$R"

R=$(curl -s $BASE/departments)
check "Departments without token → 401" 'No token provided' "$R"

R=$(curl -s $BASE/subjects)
check "Subjects without token → 401" 'No token provided' "$R"

# ── Test 8: Invalid Token → 401 ─────────────────────────────────────────
echo "── Invalid Token ──"
R=$(curl -s $BASE/auth/me -H "Authorization: Bearer fake.token.here")
check "Invalid token → 401" 'Invalid token' "$R"

# ── Test 9: Role-Based Access (Student hits Admin route) ─────────────────
echo "── Role-Based Access Control ──"
R=$(curl -s $BASE/analytics/summary -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student → admin analytics → 403" 'Access denied' "$R"

R=$(curl -s $BASE/users -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student → admin users list → 403" 'Access denied' "$R"

R=$(curl -s -X POST $BASE/departments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Dept","code":"TEST"}')
check "Student → POST departments → 403" 'Access denied' "$R"

# ── Test 10: Role-Based Access (Admin hits Student route) ────────────────
R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"abc","ratings":{}}')
check "Admin → POST feedback → 403" 'Access denied' "$R"

# ── Test 11: Admin Access to Admin Routes ────────────────────────────────
echo "── Admin Authorized Access ──"
R=$(curl -sf $BASE/analytics/summary -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin → analytics/summary → success" '"success":true' "$R"

R=$(curl -sf $BASE/users -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin → GET /users → success" '"success":true' "$R"

R=$(curl -sf $BASE/departments -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin → GET /departments → success" '"success":true' "$R"

# ── Test 12: Student Authorized Access ──────────────────────────────────
echo "── Student Authorized Access ──"
R=$(curl -sf $BASE/subjects/my -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student → GET /subjects/my → success" '"success":true' "$R"

R=$(curl -sf $BASE/feedback/submitted-subjects -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student → GET /feedback/submitted-subjects → success" '"success":true' "$R"

# ── Test 13: Feedback Validation ────────────────────────────────────────
echo "── Feedback Validation ──"
R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subjectId":"someId","ratings":{"teachingQuality":6,"communication":1,"punctuality":1,"subjectKnowledge":1,"doubtClarification":1}}')
check "Out-of-range rating → 400" 'teachingQuality' "$R"

R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ratings":{"teachingQuality":4,"communication":4,"punctuality":4,"subjectKnowledge":4,"doubtClarification":4}}')
check "Missing subjectId → 400" 'Subject ID is required' "$R"

# ── Cleanup ──────────────────────────────────────────────────────────────
kill $SERVER_PID 2>/dev/null

echo ""
echo "══════════════════════════════════════════"
printf "  Results: ✅ %d passed   ❌ %d failed\n" $PASS $FAIL
echo "══════════════════════════════════════════"
echo ""

[ $FAIL -eq 0 ] && exit 0 || exit 1
