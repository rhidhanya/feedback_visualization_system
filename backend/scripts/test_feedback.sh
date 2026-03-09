#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  Phase 3 – Feedback Submission End-to-End Test Script
#  Tests: submit, overallRating calc, duplicate block, wrong dept,
#         wrong semester, history, submitted-subjects, admin list/delete
# ══════════════════════════════════════════════════════════════
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
    echo "     Expected pattern: [$expected]"
    echo "     Got: $actual" | head -c 300
    echo ""
    FAIL=$((FAIL+1))
  fi
}

# ── Start server ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")/.."
# Reset all feedback so we start clean
node -e "
  require('dotenv').config();
  const mongoose = require('mongoose');
  const Feedback = require('./models/Feedback');
  async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    await Feedback.deleteMany({});
    console.log('Feedback cleared');
    await mongoose.disconnect();
  }
  run().catch(console.error);
"

node server.js &
SERVER_PID=$!
sleep 4

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  PHASE 3 – Feedback Submission Logic Tests"
echo "══════════════════════════════════════════════════════════"
echo ""

# ── 1. Login ──────────────────────────────────────────────────────────────────
echo "── Setup: Login as student (Ananya - CS Sem 3) ──"
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ananya@student.edu","password":"student123"}')
check "Student login" '"success":true' "$R"
STUDENT_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "── Setup: Login as admin ──"
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bitsathy.in","password":"admin123"}')
check "Admin login" '"success":true' "$R"
ADMIN_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "── Setup: Login as Rohan (IT Sem 3, different dept) ──"
R=$(curl -sf -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rohan@student.edu","password":"student123"}')
check "Rohan login" '"success":true' "$R"
ROHAN_TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# ── 2. Get Ananya's subjects (CS Sem 3 → CS301) ──────────────────────────────
echo ""
echo "── Get student subjects ──"
R=$(curl -sf $BASE/subjects/my -H "Authorization: Bearer $STUDENT_TOKEN")
check "GET /subjects/my returns data" '"success":true' "$R"
check "Contains CS301" 'CS301' "$R"
SUBJECT_ID=$(echo "$R" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
cs301 = next((s for s in data if s['subjectCode'] == 'CS301'), None)
print(cs301['_id'] if cs301 else '')
")
echo "  📌 CS301 subject ID: $SUBJECT_ID"

# ── 3. Submit valid feedback ─────────────────────────────────────────────────
echo ""
echo "── Submit valid feedback ──"
R=$(curl -sf -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subjectId\": \"$SUBJECT_ID\",
    \"ratings\": {
      \"teachingQuality\": 4,
      \"communication\": 5,
      \"punctuality\": 3,
      \"subjectKnowledge\": 4,
      \"doubtClarification\": 5
    },
    \"comments\": \"Excellent teaching style, very helpful in doubts.\"
  }")
check "Feedback submitted (201)" '"success":true' "$R"
check "overallRating present in response" '"overallRating"' "$R"

# Verify overallRating = (4+5+3+4+5)/5 = 4.2
OVERALL=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['overallRating'])")
echo "  📊 overallRating = $OVERALL (expected: 4.2)"
if [ "$OVERALL" = "4.2" ]; then
  echo "  ✅ overallRating calculation correct"
  PASS=$((PASS+1))
else
  echo "  ❌ overallRating wrong: expected 4.2, got $OVERALL"
  FAIL=$((FAIL+1))
fi

FEEDBACK_ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])")

# ── 4. Duplicate submission → 409 ────────────────────────────────────────────
echo ""
echo "── Duplicate submission ──"
R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subjectId\": \"$SUBJECT_ID\",
    \"ratings\": {
      \"teachingQuality\": 1,
      \"communication\": 1,
      \"punctuality\": 1,
      \"subjectKnowledge\": 1,
      \"doubtClarification\": 1
    }
  }")
check "Duplicate → 409 conflict" 'already submitted' "$R"

# ── 5. Wrong department → 403 ─────────────────────────────────────────────────
echo ""
echo "── Cross-department submission (Rohan tries CS301) ──"
R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $ROHAN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subjectId\": \"$SUBJECT_ID\",
    \"ratings\": {
      \"teachingQuality\": 3,
      \"communication\": 3,
      \"punctuality\": 3,
      \"subjectKnowledge\": 3,
      \"doubtClarification\": 3
    }
  }")
check "Cross-dept submission → 403" 'outside your department' "$R"

# ── 6. Wrong semester ─────────────────────────────────────────────────────────
echo ""
echo "── Wrong semester (CS401 is Sem 4, student is Sem 3) ──"
CS401_ID=$(curl -sf "$BASE/subjects?semester=4" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
s = next((x for x in data if x.get('subjectCode') == 'CS401'), None)
print(s['_id'] if s else '')
")
if [ -n "$CS401_ID" ]; then
  R=$(curl -s -X POST $BASE/feedback \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"subjectId\": \"$CS401_ID\",
      \"ratings\": {
        \"teachingQuality\": 3,
        \"communication\": 3,
        \"punctuality\": 3,
        \"subjectKnowledge\": 3,
        \"doubtClarification\": 3
      }
    }")
  check "Wrong semester → 403" 'current semester' "$R"
else
  echo "  ⚠️  CS401 not found; skipping semester test"
fi

# ── 7. Input validation ───────────────────────────────────────────────────────
echo ""
echo "── Input validation ──"
R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ratings":{"teachingQuality":3,"communication":3,"punctuality":3,"subjectKnowledge":3,"doubtClarification":3}}')
check "Missing subjectId → 400" 'Subject ID is required' "$R"

R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"subjectId\":\"$SUBJECT_ID\",\"ratings\":{\"teachingQuality\":6,\"communication\":3,\"punctuality\":3,\"subjectKnowledge\":3,\"doubtClarification\":3}}")
check "Rating > 5 → 400" 'teachingQuality' "$R"

R=$(curl -s -X POST $BASE/feedback \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"subjectId\":\"$SUBJECT_ID\",\"ratings\":{\"teachingQuality\":0,\"communication\":3,\"punctuality\":3,\"subjectKnowledge\":3,\"doubtClarification\":3}}")
check "Rating = 0 → 400" 'teachingQuality' "$R"

# ── 8. Student views submitted-subjects ──────────────────────────────────────
echo ""
echo "── GET /feedback/submitted-subjects ──"
R=$(curl -sf $BASE/feedback/submitted-subjects -H "Authorization: Bearer $STUDENT_TOKEN")
check "Submitted subjects list returned" '"success":true' "$R"
SUBMITTED=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']))")
echo "  📋 Subjects submitted by Ananya: $SUBMITTED (expected: 1)"
if [ "$SUBMITTED" = "1" ]; then
  echo "  ✅ Exactly 1 submission tracked"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected 1, got $SUBMITTED"
  FAIL=$((FAIL+1))
fi

# ── 9. Student views history ──────────────────────────────────────────────────
echo ""
echo "── GET /feedback/my ──"
R=$(curl -sf $BASE/feedback/my -H "Authorization: Bearer $STUDENT_TOKEN")
check "Feedback history returned" '"success":true' "$R"
check "Includes subject name" '"name"' "$R"
check "Includes facultyName" '"facultyName"' "$R"
check "Includes overallRating" '"overallRating"' "$R"
COUNT=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['count'])")
echo "  📋 Feedback count: $COUNT (expected: 1)"

# ── 10. Admin view all feedback ───────────────────────────────────────────────
echo ""
echo "── Admin: GET /feedback ──"
R=$(curl -sf $BASE/feedback -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can list all feedback" '"success":true' "$R"
check "Feedback has studentId populated" '"rollNumber"' "$R"
TOTAL=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['total'])")
echo "  📋 Total feedback in DB: $TOTAL"

# ── 11. Admin delete feedback ─────────────────────────────────────────────────
echo ""
echo "── Admin: DELETE /feedback/:id ──"
R=$(curl -sf -X DELETE $BASE/feedback/$FEEDBACK_ID -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin delete returns success" '"success":true' "$R"

# Verify it was deleted (submitted-subjects should now be empty)
R=$(curl -sf $BASE/feedback/submitted-subjects -H "Authorization: Bearer $STUDENT_TOKEN")
AFTER_DELETE=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']))")
if [ "$AFTER_DELETE" = "0" ]; then
  echo "  ✅ Student can re-submit after admin deletion"
  PASS=$((PASS+1))
else
  echo "  ❌ Expected 0 submitted after delete, got $AFTER_DELETE"
  FAIL=$((FAIL+1))
fi

# ── 12. Delete non-existent → 404 ─────────────────────────────────────────────
echo ""
echo "── Admin: DELETE non-existent feedback ──"
R=$(curl -s -X DELETE $BASE/feedback/000000000000000000000000 -H "Authorization: Bearer $ADMIN_TOKEN")
check "Delete non-existent → 404" 'not found' "$R"

# ── Cleanup ───────────────────────────────────────────────────────────────────
kill $SERVER_PID 2>/dev/null

echo ""
echo "══════════════════════════════════════════════════════════"
printf "  Results: ✅ %d passed   ❌ %d failed\n" $PASS $FAIL
echo "══════════════════════════════════════════════════════════"
echo ""

[ $FAIL -eq 0 ] && exit 0 || exit 1
