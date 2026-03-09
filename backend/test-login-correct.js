const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testLogins() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   LOGIN TEST - CORRECT CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test Dean Login
  try {
    console.log('🔐 Testing DEAN Login...');
    const res = await axios.post(`${API_BASE}/auth/monitor-login`, {
      email: 'dean@bitsathy.in',
      password: 'admin123'
    });
    console.log('✅ DEAN LOGIN SUCCESS');
    console.log('   Email: dean@bitsathy.in');
    console.log('   Password: admin123');
    console.log('   Token:', res.data.token.substring(0, 50) + '...');
    console.log('   Role:', res.data.user.role);
    console.log('   Dashboard: /dean/dashboard\n');
  } catch (err) {
    if (err.response) {
      console.error('❌ DEAN LOGIN FAILED:', err.response.status, err.response.data.message);
    } else {
      console.error('❌ DEAN LOGIN ERROR:', err.message);
    }
  }

  // Test Principal Login
  try {
    console.log('🔐 Testing PRINCIPAL Login...');
    const res = await axios.post(`${API_BASE}/auth/monitor-login`, {
      email: 'principal@bitsathy.in',
      password: 'admin123'
    });
    console.log('✅ PRINCIPAL LOGIN SUCCESS');
    console.log('   Email: principal@bitsathy.in');
    console.log('   Password: admin123');
    console.log('   Token:', res.data.token.substring(0, 50) + '...');
    console.log('   Role:', res.data.user.role);
    console.log('   Dashboard: /principal/dashboard\n');
  } catch (err) {
    if (err.response) {
      console.error('❌ PRINCIPAL LOGIN FAILED:', err.response.status, err.response.data.message);
    } else {
      console.error('❌ PRINCIPAL LOGIN ERROR:', err.message);
    }
  }

  // Test Incharge Login (Transport)
  try {
    console.log('🔐 Testing INCHARGE (Transport) Login...');
    const res = await axios.post(`${API_BASE}/auth/domain-head-login`, {
      email: 'ravi.kumar@bitsathy.in',
      password: 'transport123'
    });
    console.log('✅ TRANSPORT INCHARGE LOGIN SUCCESS');
    console.log('   Email: ravi.kumar@bitsathy.in');
    console.log('   Password: transport123');
    console.log('   Token:', res.data.token.substring(0, 50) + '...');
    console.log('   Role:', res.data.user.role);
    console.log('   Assigned Domain:', res.data.user.assignedDomain);
    console.log('   Dashboard: /domain-head/dashboard\n');
  } catch (err) {
    if (err.response) {
      console.error('❌ TRANSPORT INCHARGE LOGIN FAILED:', err.response.status, err.response.data.message);
    } else {
      console.error('❌ TRANSPORT INCHARGE LOGIN ERROR:', err.message);
    }
  }

  // Test other Incharges
  const incharges = [
    { email: 'sunita.sharma@bitsathy.in', password: 'mess123', domain: 'Mess' },
    { email: 'anil.mehta@bitsathy.in', password: 'hostel123', domain: 'Hostel' },
    { email: 'priya.das@bitsathy.in', password: 'sanitation123', domain: 'Sanitation' },
  ];

  for (const inc of incharges) {
    try {
      console.log(`🔐 Testing INCHARGE (${inc.domain}) Login...`);
      const res = await axios.post(`${API_BASE}/auth/domain-head-login`, {
        email: inc.email,
        password: inc.password
      });
      console.log(`✅ ${inc.domain.toUpperCase()} INCHARGE LOGIN SUCCESS`);
      console.log(`   Email: ${inc.email}`);
      console.log(`   Password: ${inc.password}`);
      console.log(`   Role: ${res.data.user.role}`);
      console.log(`   Assigned Domain: ${res.data.user.assignedDomain}\n`);
    } catch (err) {
      if (err.response) {
        console.error(`❌ ${inc.domain.toUpperCase()} INCHARGE LOGIN FAILED:`, err.response.data.message);
      } else {
        console.error(`❌ ${inc.domain.toUpperCase()} INCHARGE LOGIN ERROR:`, err.message);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testLogins().catch(console.error);
