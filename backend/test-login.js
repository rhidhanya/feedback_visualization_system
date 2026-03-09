const axios = require('axios');
async function testStudentLogin() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/student-login', {
      email: 'student1@student.edu',
      password: 'studentpassword'
    });
    console.log('Student Login Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Student Login Error:', err.response.status, err.response.data);
    } else {
      console.error('Student Login Request Error:', err.message);
    }
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/faculty-login', {
      email: 'faculty1@bitsathy.in',
      password: 'facultypassword'
    });
    console.log('Faculty Login Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Faculty Login Error:', err.response.status, err.response.data);
    } else {
      console.error('Faculty Login Request Error:', err.message);
    }
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/monitor-login', {
      email: 'dean@bitsathy.in',
      password: 'admin123'
    });
    console.log('Dean Login Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Dean Login Error:', err.response.status, err.response.data);
    } else {
      console.error('Dean Login Request Error:', err.message);
    }
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/domain-head-login', {
      email: 'transport-head@bitsathy.in',
      password: 'incharge123'
    });
    console.log('Incharge Login Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.error('Incharge Login Error:', err.response.status, err.response.data);
    } else {
      console.error('Incharge Login Request Error:', err.message);
    }
  }
}
testStudentLogin();
