async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'ananya@bitsathy.in', password: 'student123'})
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const feedbackRes = await fetch('http://localhost:5000/api/domain-feedback', {
            method: 'POST',
            body: JSON.stringify({
                domainSlug: 'transport',
                answers: [{questionId:"67c87c0500ce61e47858cfa9",rating:4,comment:""}],
                generalComment: 'Good',
                semester: 3,
                academicYear: '2024-25'
            }),
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
            }
        });
        const data = await feedbackRes.json();
        console.log(data);
    } catch (err) {
        console.error(err);
    }
}
test();
