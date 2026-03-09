const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let testDeptId = '';

async function runTests() {
    try {
        console.log('--- Starting HOD API Tests ---');

        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/admin-login`, {
            email: 'admin@bitsathy.in',
            password: 'admin123'
        });
        adminToken = loginRes.data.token;
        console.log('✅ Admin login successful');

        const authHeader = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 2. Get departments to pick one
        const deptsRes = await axios.get(`${API_URL}/departments`, authHeader);
        const departments = deptsRes.data.data;
        if (!departments || departments.length === 0) {
            throw new Error('No departments found to test with');
        }
        testDeptId = departments[0]._id;
        console.log(`✅ Using department: ${departments[0].name} (${testDeptId})`);

        // 3. Delete existing HOD if any (to start fresh)
        const currentHods = await axios.get(`${API_URL}/admin/hod`, authHeader);
        const existing = currentHods.data.data.find(h => h.department._id === testDeptId);
        if (existing) {
            await axios.delete(`${API_URL}/admin/hod/${existing._id}`, authHeader);
            console.log('✅ Cleaned up existing HOD for test department');
        }

        // 4. Create HOD
        const hodData = {
            name: 'Test HOD',
            email: 'testhod@bitsathy.in',
            password: 'password123',
            department: testDeptId,
            hodId: 'TEST_HOD_001',
            contact: '1234567890'
        };
        const createRes = await axios.post(`${API_URL}/admin/hod`, hodData, authHeader);
        const newHodId = createRes.data.data._id;
        console.log('✅ HOD created successfully');

        // 5. Try creating another HOD for the same department (SHOULD FAIL)
        try {
            await axios.post(`${API_URL}/admin/hod`, {
                ...hodData,
                email: 'another@bitsathy.in',
                hodId: 'TEST_HOD_002'
            }, authHeader);
            console.log('❌ FAIL: Allowed creating duplicate HOD for department');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                console.log('✅ PASS: Correctly blocked duplicate HOD for department');
            } else {
                console.log('❌ FAIL: Unexpected error blocking duplicate HOD:', err.message);
            }
        }

        // 6. Update HOD
        await axios.put(`${API_URL}/admin/hod/${newHodId}`, { name: 'Updated HOD' }, authHeader);
        console.log('✅ HOD updated successfully');

        // 7. Verify Department model updated
        const checkDept = await axios.get(`${API_URL}/departments`, authHeader);
        const dept = checkDept.data.data.find(d => d._id === testDeptId);
        if (dept.hodName === 'Updated HOD') {
            console.log('✅ Department hodName updated correctly');
        } else {
            console.log('❌ FAIL: Department hodName not updated. Got:', dept.hodName);
        }

        // 8. Delete HOD
        await axios.delete(`${API_URL}/admin/hod/${newHodId}`, authHeader);
        console.log('✅ HOD deleted successfully');

        // 9. Verify Department model cleared
        const checkDeptAfter = await axios.get(`${API_URL}/departments`, authHeader);
        const deptAfter = checkDeptAfter.data.data.find(d => d._id === testDeptId);
        if (deptAfter.hodName === '') {
            console.log('✅ Department hodName cleared correctly');
        } else {
            console.log('❌ FAIL: Department hodName not cleared. Got:', deptAfter.hodName);
        }

        console.log('--- HOD API Tests Completed Successfully ---');
    } catch (err) {
        console.error('❌ Test script crashed:', err.response?.data || err.message);
    }
}

runTests();
