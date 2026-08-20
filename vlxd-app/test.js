const http = require('http');
const assert = require('assert');
const { server } = require('./server.js');

const TEST_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : {}; } catch (e) { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting VLXD Manager in-process test server on port', TEST_PORT);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log('✓ Server is ready to accept requests');

  try {
    console.log('\n--- 1. Testing Authentication ---');
    const adminLogin = await request('POST', '/api/login', { username: 'admin', password: 'admin123' });
    assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
    const adminToken = adminLogin.data.token;
    assert.ok(adminToken, 'Admin should receive token');
    console.log('✓ Admin login OK');

    const editorLogin = await request('POST', '/api/login', { username: 'banhang', password: 'banhang123' });
    assert.strictEqual(editorLogin.status, 200, 'Editor login should succeed');
    const editorToken = editorLogin.data.token;
    console.log('✓ Editor login OK');

    const viewerLogin = await request('POST', '/api/login', { username: 'khach', password: 'xem123' });
    assert.strictEqual(viewerLogin.status, 200, 'Viewer login should succeed');
    const viewerToken = viewerLogin.data.token;
    console.log('✓ Viewer login OK');

    console.log('\n--- 2. Testing RBAC for User Management ---');
    const viewerGetUsers = await request('GET', '/api/users', null, viewerToken);
    assert.strictEqual(viewerGetUsers.status, 403, 'Viewer should NOT be allowed to list users');
    console.log('✓ Viewer access forbidden OK (403)');

    const editorGetUsers = await request('GET', '/api/users', null, editorToken);
    assert.strictEqual(editorGetUsers.status, 403, 'Editor should NOT be allowed to list users');
    console.log('✓ Editor access forbidden OK (403)');

    const adminGetUsers = await request('GET', '/api/users', null, adminToken);
    assert.strictEqual(adminGetUsers.status, 200, 'Admin should be allowed to list users');
    assert.ok(Array.isArray(adminGetUsers.data), 'Admin should receive array of users');
    console.log(`✓ Admin list users OK (Found ${adminGetUsers.data.length} users)`);

    console.log('\n--- 3. Testing Create User ---');
    const testUsername = `testuser_${Date.now()}`;
    const createRes = await request('POST', '/api/users', {
      username: testUsername,
      name: 'Nguyễn Văn Test',
      password: 'password123',
      role: 'editor'
    }, adminToken);
    assert.strictEqual(createRes.status, 200, 'Create user should succeed');
    console.log('✓ Create user OK');

    const dupRes = await request('POST', '/api/users', {
      username: testUsername,
      name: 'Nguyễn Văn Test Duplicate',
      password: 'password123',
      role: 'editor'
    }, adminToken);
    assert.strictEqual(dupRes.status, 400, 'Duplicate username should fail');
    console.log('✓ Duplicate username rejected OK');

    const testLogin = await request('POST', '/api/login', { username: testUsername, password: 'password123' });
    assert.strictEqual(testLogin.status, 200, 'New user login should succeed');
    console.log('✓ New user can log in OK');

    console.log('\n--- 4. Testing Role Change ---');
    const usersList = await request('GET', '/api/users', null, adminToken);
    const createdUser = usersList.data.find(u => u.username === testUsername);
    assert.ok(createdUser, 'Created user should be in list');

    const changeRoleRes = await request('POST', `/api/users/${createdUser.id}/role`, { role: 'viewer' }, adminToken);
    assert.strictEqual(changeRoleRes.status, 200, 'Change role should succeed');

    const updatedUsersList = await request('GET', '/api/users', null, adminToken);
    const updatedUser = updatedUsersList.data.find(u => u.username === testUsername);
    assert.strictEqual(updatedUser.role, 'viewer', 'Role should be updated to viewer');
    console.log('✓ Change role to viewer OK');

    console.log('\n--- 5. Testing Password Reset ---');
    const resetPassRes = await request('POST', `/api/users/${createdUser.id}/password`, { password: 'newpassword456' }, adminToken);
    assert.strictEqual(resetPassRes.status, 200, 'Password reset should succeed');

    const oldLogin = await request('POST', '/api/login', { username: testUsername, password: 'password123' });
    assert.strictEqual(oldLogin.status, 401, 'Old password should fail');

    const newLogin = await request('POST', '/api/login', { username: testUsername, password: 'newpassword456' });
    assert.strictEqual(newLogin.status, 200, 'New password login should succeed');
    console.log('✓ Password reset and new login OK');

    console.log('\n--- 6. Testing Delete User ---');
    const delRes = await request('DELETE', `/api/users/${createdUser.id}`, null, adminToken);
    assert.strictEqual(delRes.status, 200, 'Delete user should succeed');

    const afterDelUsers = await request('GET', '/api/users', null, adminToken);
    assert.ok(!afterDelUsers.data.some(u => u.id === createdUser.id), 'Deleted user should not exist');
    console.log('✓ Delete user OK');

    console.log('\n--- 7. Testing Safety Guards ---');
    const currentAdminUser = usersList.data.find(u => u.username === 'admin');
    const selfRoleChange = await request('POST', `/api/users/${currentAdminUser.id}/role`, { role: 'editor' }, adminToken);
    assert.strictEqual(selfRoleChange.status, 400, 'Changing own role should be rejected');
    console.log('✓ Self-role change rejection guard OK');

    const selfDelete = await request('DELETE', `/api/users/${currentAdminUser.id}`, null, adminToken);
    assert.strictEqual(selfDelete.status, 400, 'Deleting self should be rejected');
    console.log('✓ Self-delete rejection guard OK');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
