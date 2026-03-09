const axios = require('axios');
async function testLogins() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/student-login', {
      email: 'priya.kumar1@student.edu', // Taken from seed output format
      password: 'student123'
    });
    console.log('Student Login Response:', res.status, res.data.success);
  } catch (err) {
    console.error('Student Login Error:', err.response?.status, err.response?.data);
  }

  try {
    const defaultFacultyEmail = 'suresh.nair@bitsathy.in';
    const res = await axios.post('http://localhost:5000/api/auth/faculty-login', {
      email: defaultFacultyEmail,
      password: 'faculty123'
    });
    console.log('Faculty Login Response:', res.status, res.data.success);
  } catch (err) {
    console.error('Faculty Login Error:', err.response?.status, err.response?.data);
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@bitsathy.in',
      password: 'admin123'
    });
    console.log('Admin Login Response:', res.status, res.data.success);
  } catch (err) {
    console.error('Admin Login Error:', err.response?.status, err.response?.data);
  }
}
testLogins();
