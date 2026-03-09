#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
#  Phase 4 – Analytics & Aggregation APIs Test Script
#  Tests all 6 analytics endpoints: summary, by-faculty, by-subject,
#  distribution, trend, low-performers — with and without filters
# ══════════════════════════════════════════════════════════════════════
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
    echo "     Expected: [$expected]"
    echo "     Got: $(echo "$actual" | head -c 400)"
    echo ""
    FAIL=$((FAIL+1))
  fi
}

checkNum() {
  local label=$1
  local condition=$2  # python expression using 'v' for the value
  local actual=$3
  local extracted=$4  # python snippet to extract numeric
  local v
  v=$(echo "$actual" | python3 -c "import sys,json; d=json.load(sys.stdin); $extracted" 2>/dev/null || echo "ERR")
  if python3 -c "v=$v; result = ($condition); exit(0 if result else 1)" 2>/dev/null; then
    echo "  ✅ $label (value=$v)"
    PASS=$((PASS+1))
  else
    echo "  ❌ $label (wanted: $condition, got=$v)"
    FAIL=$((FAIL+1))
  fi
}

# ── Start server ──────────────────────────────────────────────────────────────
cd "$(dirname "$0")/.."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 1
node server.js &
SERVER_PID=$!
sleep 4

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  PHASE 4 – Analytics & Aggregation API Tests"
echo "════════════════════════════════════════════════════════════════"
echo ""

# ── Get admin token ────────────────────────────────────────────────────────────
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitsathy.in","password":"admin123"}')
ADMIN_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "  ✅ Admin authenticated"
PASS=$((PASS+1))

# Get department IDs for filter tests
DEPTS=$(curl -sf $BASE/departments -H "Authorization: Bearer $ADMIN_TOKEN")
CS_ID=$(echo "$DEPTS" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(next(x['_id'] for x in d if x['code']=='CS'))")
IT_ID=$(echo "$DEPTS" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(next(x['_id'] for x in d if x['code']=='IT'))")
echo "  ✅ Dept IDs: CS=$CS_ID, IT=$IT_ID"
PASS=$((PASS+1))

# ══ 1. SUMMARY ══════════════════════════════════════════════════════════════
echo ""
echo "── 1. GET /analytics/summary (all data) ──"
R=$(curl -sf "$BASE/analytics/summary" -H "Authorization: Bearer $ADMIN_TOKEN")
check "summary returns success" '"success":true' "$R"
check "totalFeedback present" '"totalFeedback"' "$R"
check "avgOverallRating present" '"avgOverallRating"' "$R"
check "lowPerformerCount present" '"lowPerformerCount"' "$R"

TOTAL_FB=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['totalFeedback'])")
AVG_RATING=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['avgOverallRating'])")
LOWCOUNT=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['lowPerformerCount'])")
echo "     📊 Total: $TOTAL_FB | Avg: $AVG_RATING | Low performers: $LOWCOUNT"

if [ "$TOTAL_FB" = "20" ]; then
  echo "  ✅ totalFeedback = 20 (correct)"
  PASS=$((PASS+1))
else
  echo "  ❌ totalFeedback should be 20, got $TOTAL_FB"
  FAIL=$((FAIL+1))
fi

if python3 -c "v=float('$AVG_RATING'); exit(0 if v > 0 else 1)" 2>/dev/null; then
  echo "  ✅ avgOverallRating > 0"
  PASS=$((PASS+1))
else
  echo "  ❌ avgOverallRating invalid: $AVG_RATING"
  FAIL=$((FAIL+1))
fi

if python3 -c "v=int('$LOWCOUNT'); exit(0 if v >= 2 else 1)" 2>/dev/null; then
  echo "  ✅ lowPerformerCount >= 2 (≥2 low-rated subjects expected)"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected ≥2 low performers, got $LOWCOUNT"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 1b. GET /analytics/summary?department=CS ──"
R=$(curl -sf "$BASE/analytics/summary?department=$CS_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "filtered summary returns success" '"success":true' "$R"
FILTERED_FB=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['totalFeedback'])")
echo "     📊 CS dept total: $FILTERED_FB (expected: 9)"
if [ "$FILTERED_FB" = "9" ]; then
  echo "  ✅ CS dept filter correct (9 submissions)"
  PASS=$((PASS+1))
else
  echo "  ❌ CS dept filter wrong: expected 9, got $FILTERED_FB"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 1c. GET /analytics/summary?semester=3 ──"
R=$(curl -sf "$BASE/analytics/summary?semester=3" -H "Authorization: Bearer $ADMIN_TOKEN")
SEM3_FB=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['totalFeedback'])")
echo "     📊 Semester 3 total: $SEM3_FB (expected: 13)"
if [ "$SEM3_FB" = "13" ]; then
  echo "  ✅ Semester 3 filter correct (13 submissions)"
  PASS=$((PASS+1))
else
  echo "  ❌ Semester 3 filter wrong: expected 13, got $SEM3_FB"
  FAIL=$((FAIL+1))
fi

# ══ 2. BY-FACULTY ══════════════════════════════════════════════════════════
echo ""
echo "── 2. GET /analytics/by-faculty ──"
R=$(curl -sf "$BASE/analytics/by-faculty" -H "Authorization: Bearer $ADMIN_TOKEN")
check "by-faculty returns success" '"success":true' "$R"
check "includes facultyName" '"facultyName"' "$R"
check "includes avgRating" '"avgRating"' "$R"
check "includes avgTeachingQuality" '"avgTeachingQuality"' "$R"
check "includes totalFeedback" '"totalFeedback"' "$R"
check "includes subjects list" '"subjects"' "$R"

FACULTY_COUNT=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
echo "     📊 Unique faculty: $FACULTY_COUNT (expected: 4 — Suresh Nair teaches 2 subjects so counted once per group)"

# Verify rankings: highest and lowest
TOP_FACULTY=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['facultyName']) if d else print('N/A')")
BOT_FACULTY=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[-1]['facultyName']) if d else print('N/A')")
TOP_RATING=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['avgRating']) if d else print(0)")
BOT_RATING=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[-1]['avgRating']) if d else print(0)")
echo "     🏆 Top: $TOP_FACULTY ($TOP_RATING) | Bottom: $BOT_FACULTY ($BOT_RATING)"

if python3 -c "exit(0 if float('$TOP_RATING') > float('$BOT_RATING') else 1)" 2>/dev/null; then
  echo "  ✅ Faculty sorted by avgRating descending"
  PASS=$((PASS+1))
else
  echo "  ❌ Faculty not sorted correctly"
  FAIL=$((FAIL+1))
fi

if python3 -c "exit(0 if float('$BOT_RATING') < 2.5 else 1)" 2>/dev/null; then
  echo "  ✅ Bottom faculty has avg < 2.5 (low performer confirmed)"
  PASS=$((PASS+1))
else
  echo "  ❌ Bottom faculty rating ≥ 2.5, expected a low performer"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 2b. GET /analytics/by-faculty?department=IT ──"
R=$(curl -sf "$BASE/analytics/by-faculty?department=$IT_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "IT dept faculty filter works" '"success":true' "$R"
IT_FACULTY=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(', '.join(x['facultyName'] for x in d))")
echo "     📊 IT faculty: $IT_FACULTY"

# ══ 3. BY-SUBJECT ══════════════════════════════════════════════════════════
echo ""
echo "── 3. GET /analytics/by-subject ──"
R=$(curl -sf "$BASE/analytics/by-subject" -H "Authorization: Bearer $ADMIN_TOKEN")
check "by-subject returns success" '"success":true' "$R"
check "includes subjectName" '"subjectName"' "$R"
check "includes subjectCode" '"subjectCode"' "$R"
check "includes facultyName" '"facultyName"' "$R"
check "includes avgRating" '"avgRating"' "$R"
check "includes totalFeedback" '"totalFeedback"' "$R"

SUBJ_COUNT=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
echo "     📊 Subjects with feedback: $SUBJ_COUNT (expected: 6)"
if [ "$SUBJ_COUNT" = "6" ]; then
  echo "  ✅ All 6 subjects present in analytics"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected 6 subjects, got $SUBJ_COUNT"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 3b. GET /analytics/by-subject?semester=4 ──"
R=$(curl -sf "$BASE/analytics/by-subject?semester=4" -H "Authorization: Bearer $ADMIN_TOKEN")
SEM4_SUBJ=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
echo "     📊 Semester 4 subjects: $SEM4_SUBJ (expected: 3)"
if [ "$SEM4_SUBJ" = "3" ]; then
  echo "  ✅ Semester 4 filter returns 3 subjects"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected 3 sem-4 subjects, got $SEM4_SUBJ"
  FAIL=$((FAIL+1))
fi

# ══ 4. DISTRIBUTION ════════════════════════════════════════════════════════
echo ""
echo "── 4. GET /analytics/distribution ──"
R=$(curl -sf "$BASE/analytics/distribution" -H "Authorization: Bearer $ADMIN_TOKEN")
check "distribution returns success" '"success":true' "$R"

# Verify all 5 buckets present
for star in 1 2 3 4 5; do
  check "star $star bucket present" "\"$star\"" "$R"
done

# High-rated subjects should have most 4s and 5s
STAR4=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('4',0))")
STAR5=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('5',0))")
STAR1=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('1',0))")
HIGH=$(( STAR4 + STAR5 ))
echo "     📊 ⭐4: $STAR4 | ⭐5: $STAR5 (high = $HIGH) | ⭐1: $STAR1"

if python3 -c "exit(0 if $HIGH > 0 else 1)" 2>/dev/null; then
  echo "  ✅ High-rated (4+5 star) distribution present"
  PASS=$((PASS+1))
else
  echo "  ❌ No high-rated feedback found"
  FAIL=$((FAIL+1))
fi

if python3 -c "exit(0 if $STAR1 > 0 else 1)" 2>/dev/null; then
  echo "  ✅ Low-rated (1 star) distribution present (from Rajesh Pillai)"
  PASS=$((PASS+1))
else
  echo "  ❌ No 1-star feedback found"
  FAIL=$((FAIL+1))
fi

# ══ 5. TREND ═══════════════════════════════════════════════════════════════
echo ""
echo "── 5. GET /analytics/trend ──"
R=$(curl -sf "$BASE/analytics/trend" -H "Authorization: Bearer $ADMIN_TOKEN")
check "trend returns success" '"success":true' "$R"
check "includes semester field" '"semester"' "$R"
check "includes academicYear field" '"academicYear"' "$R"
check "includes label field" '"label"' "$R"
check "includes avgRating" '"avgRating"' "$R"

TREND_COUNT=$(echo "$R" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))")
echo "     📊 Trend data points: $TREND_COUNT (expected: 4 — Sem3 2024-25, Sem4 2023-24 per dept combinations)"

# Should have data for both semesters and academic years
LABEL_CHECK=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; labels=[x['label'] for x in d]; print(' | '.join(labels))")
echo "     📈 Trend labels: $LABEL_CHECK"
check "2024-25 in labels" '2024-25' "$R"
check "2023-24 in labels" '2023-24' "$R"
check "Sem 3 appears" 'Sem 3' "$R"
check "Sem 4 appears" 'Sem 4' "$R"

# ══ 6. LOW PERFORMERS ══════════════════════════════════════════════════════
echo ""
echo "── 6. GET /analytics/low-performers ──"
R=$(curl -sf "$BASE/analytics/low-performers" -H "Authorization: Bearer $ADMIN_TOKEN")
check "low-performers returns success" '"success":true' "$R"
check "threshold field returned" '"threshold"' "$R"
check "count field returned" '"count"' "$R"
check "gap field in data" '"gap"' "$R"

LP_COUNT=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
LP_NAMES=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(', '.join(x['facultyName'] for x in d))")
echo "     📊 Low performers: $LP_COUNT → $LP_NAMES"

if python3 -c "exit(0 if int('$LP_COUNT') >= 2 else 1)" 2>/dev/null; then
  echo "  ✅ At least 2 low performers detected"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected ≥2 low performers, got $LP_COUNT"
  FAIL=$((FAIL+1))
fi

# Validate each low performer's rating is actually < 2.5
BELOW=$(echo "$R" | python3 -c "
import sys,json
data = json.load(sys.stdin)['data']
all_below = all(x['avgRating'] < 2.5 for x in data)
print('yes' if all_below else 'no')
")
if [ "$BELOW" = "yes" ]; then
  echo "  ✅ All low performers have avgRating < 2.5 (threshold correct)"
  PASS=$((PASS+1))
else
  echo "  ❌ Some low performers have rating >= 2.5"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 6b. GET /analytics/low-performers?threshold=4.0 ──"
R=$(curl -sf "$BASE/analytics/low-performers?threshold=4.0" -H "Authorization: Bearer $ADMIN_TOKEN")
check "custom threshold request returns success" '"success":true' "$R"
LP_CUSTOM=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
echo "     📊 Faculty below 4.0: $LP_CUSTOM (should be > 2)"
if python3 -c "exit(0 if int('$LP_CUSTOM') > 2 else 1)" 2>/dev/null; then
  echo "  ✅ Custom threshold (4.0) widens low-performer list"
  PASS=$((PASS+1))
else
  echo "  ❌ Custom threshold didn't expand list"
  FAIL=$((FAIL+1))
fi

echo ""
echo "── 6c. GET /analytics/low-performers?department=IT ──"
R=$(curl -sf "$BASE/analytics/low-performers?department=$IT_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
check "dept-filtered low performers" '"success":true' "$R"
IT_LP=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
echo "     📊 IT dept low performers: $IT_LP"

# ══ 7. UNAUTHORIZED ACCESS ══════════════════════════════════════════════════
echo ""
echo "── 7. Analytics unauthorized access (student token) ──"
R2=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya@student.edu","password":"student123"}')
STUD_TOKEN=$(echo "$R2" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
R=$(curl -s "$BASE/analytics/summary" -H "Authorization: Bearer $STUD_TOKEN")
check "Student → analytics → 403" 'Access denied' "$R"
R=$(curl -s "$BASE/analytics/by-faculty" -H "Authorization: Bearer $STUD_TOKEN")
check "Student → by-faculty → 403" 'Access denied' "$R"
R=$(curl -s "$BASE/analytics/low-performers" -H "Authorization: Bearer $STUD_TOKEN")
check "Student → low-performers → 403" 'Access denied' "$R"

# ── Cleanup ───────────────────────────────────────────────────────────────────
kill $SERVER_PID 2>/dev/null

echo ""
echo "════════════════════════════════════════════════════════════════"
printf "  Results: ✅ %d passed   ❌ %d failed\n" $PASS $FAIL
echo "════════════════════════════════════════════════════════════════"
echo ""

[ $FAIL -eq 0 ] && exit 0 || exit 1
