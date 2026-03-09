const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'dhanesh.devi@bitsathy.in', 
      password: 'student123'
    });
    const token = loginRes.data.token;
    console.log("Logged in");
    
    // get subjects
    const subRes = await axios.get('http://localhost:5000/api/subjects/my', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const subjects = subRes.data.data;
    if (subjects.length > 0) {
      const subject = subjects[0];
      console.log("Submitting for subject: ", subject.name);
      
      const res = await axios.post('http://localhost:5000/api/feedback', {
        subjectId: subject._id,
        ratings: {
            teachingQuality: 5,
            communication: 5,
            punctuality: 5,
            subjectKnowledge: 5,
            doubtClarification: 5
        },
        comments: "Test"
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log(res.data);
    } else {
      console.log("No subjects found");
    }
  } catch (e) {
    if (e.response) {
      console.error(e.response.status, e.response.data);
    } else {
      console.error(e);
    }
  }
}
test();
