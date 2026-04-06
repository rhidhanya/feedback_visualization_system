const axios = require('axios');

async function testAuth() {
  try {
    console.log("Attempting admin login...");
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bitsathy.in',
      password: 'admin123' 
    });
    
    const token = loginRes.data.token;
    console.log("Login successful! Token acquired.");
    console.log("Logged in user role:", loginRes.data.user.role);
    
    console.log("Attempting to access /api/issues/summary...");
    try {
      const res = await axios.get('http://localhost:5000/api/issues/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Access granted! Status:", res.status);
    } catch (err) {
      console.log("Access denied! Status:", err.response?.status);
      console.log("Message:", err.response?.data?.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Login failed:", err.message);
    process.exit(1);
  }
}

testAuth();
