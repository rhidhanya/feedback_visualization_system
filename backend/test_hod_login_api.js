const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login as HOD...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'hod.cse@bitsathy.in',
            password: 'password'
        });
        
        console.log('Login Success!');
        console.log('Response Data:', JSON.stringify(res.data, null, 2));
        
        if (res.data.user.role === 'hod') {
            console.log('✅ Role is correctly identified as "hod"');
        } else {
            console.log('❌ Role mismatch! Found:', res.data.user.role);
        }
    } catch (err) {
        console.log('Login Failed!');
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Error Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.log('Error:', err.message);
        }
    }
}

testLogin();
