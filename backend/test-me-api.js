const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@bitsathy.in',
      password: 'admin123'
    });
    const token = res.data.token;
    
    console.log("Logged in:", res.data.user);
    
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("Auth Me keys:", Object.keys(meRes.data.user));
    console.log("Role:", meRes.data.user.role);
    process.exit(0);
  } catch(e) {
    if (e.response) {
      console.log("Error status:", e.response.status, e.response.data);
    } else {
      console.log("Error:", e.message);
    }
    process.exit(1);
  }
}
test();
