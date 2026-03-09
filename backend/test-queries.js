const axios = require('axios');

async function testScenario() {
  let studentToken, deanToken, inchargeToken;

  // 1. Student logs in
  try {
    const res1 = await axios.post('http://localhost:5000/api/auth/student-login', {
      email: 'priya.kumar1@student.edu', 
      password: 'student123'
    });
    studentToken = res1.data.token;
    console.log('✅ Student Login OK', res1.data.user.name);
  } catch (err) { console.error('Student Login Fail'); return; }

  // 2. Student creates a query
  try {
    const res2 = await axios.post('http://localhost:5000/api/queries', {
      domain: 'transport',
      subject: 'Bus #4 is consistently late',
      description: 'The bus arriving at MG Road stop is consistently 15m late.'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log('✅ Query Created', res2.data.data._id);
  } catch (err) { console.error('Query Create Fail', err.response?.data); }

  // 3. Incharge logs in & views queries
  try {
    const res3 = await axios.post('http://localhost:5000/api/auth/domain-head-login', {
      email: 'transport-head@bitsathy.in', 
      password: 'incharge123'
    });
    inchargeToken = res3.data.token;
    console.log('✅ Incharge Login OK', res3.data.user.name);

    const res4 = await axios.get('http://localhost:5000/api/queries', { 
        headers: { Authorization: `Bearer ${inchargeToken}` } 
    });
    console.log('✅ Incharge specific queries visible:', res4.data.count);
  } catch (err) { console.error('Incharge queries view fail', err.response?.data); }

  // 4. Dean logs in & creates a message
  try {
    const res5 = await axios.post('http://localhost:5000/api/auth/monitor-login', {
      email: 'dean@bitsathy.in', 
      password: 'admin123'
    });
    deanToken = res5.data.token;
    console.log('✅ Dean Login OK', res5.data.user.name);

    const res6 = await axios.post('http://localhost:5000/api/messages', {
        receiverRoles: ['principal'],
        text: 'Checking if message system works'
    }, { headers: { Authorization: `Bearer ${deanToken}` } });
    console.log('✅ Message Created', res6.data.data._id);
  } catch (err) { console.error('Dean message fail', err.response?.data); }

}
testScenario();
