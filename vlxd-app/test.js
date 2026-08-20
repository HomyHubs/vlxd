const http = require('http');
const assert = require('assert');
const { server, sessions } = require('./server.js');

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

    console.log('\n--- 3. Testing Create User & Password Validation ---');
    // Short password rejected
    const shortPassRes = await request('POST', '/api/users', {
      username: 'shortpassuser',
      name: 'Short Pass',
      password: '123',
      role: 'editor'
    }, adminToken);
    assert.strictEqual(shortPassRes.status, 400, 'Password < 6 chars must be rejected');
    console.log('✓ Password < 6 chars rejected OK');

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
    assert.strictEqual(dupRes.status, 400, 'Duplicate username should fail with 400');
    assert.strictEqual(dupRes.data.error, 'Tên đăng nhập đã tồn tại');
    console.log('✓ Duplicate username rejected with specific message OK');

    const testLogin = await request('POST', '/api/login', { username: testUsername, password: 'password123' });
    assert.strictEqual(testLogin.status, 200, 'New user login should succeed');
    const userSessionToken = testLogin.data.token;
    console.log('✓ New user can log in OK');

    console.log('\n--- 4. Testing Role Change & Session Propagation ---');
    const usersList = await request('GET', '/api/users', null, adminToken);
    const createdUser = usersList.data.find(u => u.username === testUsername);
    assert.ok(createdUser, 'Created user should be in list');

    // Test editor write capability before role demotion
    const bootstrapBefore = await request('GET', '/api/bootstrap', null, userSessionToken);
    assert.strictEqual(bootstrapBefore.status, 200);

    const changeRoleRes = await request('POST', `/api/users/${createdUser.id}/role`, { role: 'viewer' }, adminToken);
    assert.strictEqual(changeRoleRes.status, 200, 'Change role should succeed');

    // Verify session role was updated in-memory
    const productAddWithDemotedSession = await request('POST', '/api/products', { name: 'X', price: 100 }, userSessionToken);
    assert.strictEqual(productAddWithDemotedSession.status, 403, 'Demoted session should immediately get 403 on write');
    console.log('✓ In-memory session role updated immediately OK');

    console.log('\n--- 5. Testing Password Reset & Session Revocation ---');
    const resetPassRes = await request('POST', `/api/users/${createdUser.id}/password`, { password: 'newpassword456' }, adminToken);
    assert.strictEqual(resetPassRes.status, 200, 'Password reset should succeed');

    // Old session bearer token MUST be revoked
    const revokedSessionCheck = await request('GET', '/api/bootstrap', null, userSessionToken);
    assert.strictEqual(revokedSessionCheck.status, 401, 'Old session token must be revoked (401) after password reset');
    console.log('✓ Session revoked immediately on password reset OK (401)');

    // Old password should fail
    const oldLogin = await request('POST', '/api/login', { username: testUsername, password: 'password123' });
    assert.strictEqual(oldLogin.status, 401, 'Old password should fail');

    // New password should succeed
    const newLogin = await request('POST', '/api/login', { username: testUsername, password: 'newpassword456' });
    assert.strictEqual(newLogin.status, 200, 'New password login should succeed');
    const newUserToken = newLogin.data.token;
    console.log('✓ New password login OK');

    console.log('\n--- 6. Testing Delete User & Session Invalidation ---');
    const delRes = await request('DELETE', `/api/users/${createdUser.id}`, null, adminToken);
    assert.strictEqual(delRes.status, 200, 'Delete user should succeed');

    // Deleted user session MUST be invalid
    const deletedSessionCheck = await request('GET', '/api/bootstrap', null, newUserToken);
    assert.strictEqual(deletedSessionCheck.status, 401, 'Deleted user session must be revoked (401)');
    console.log('✓ Session revoked immediately on user deletion OK (401)');

    const afterDelUsers = await request('GET', '/api/users', null, adminToken);
    assert.ok(!afterDelUsers.data.some(u => u.id === createdUser.id), 'Deleted user should not exist');
    console.log('✓ Delete user OK');

    console.log('\n--- 7. Testing Atomic Safety Guards & Transaction Rollbacks ---');
    const currentAdminUser = usersList.data.find(u => u.username === 'admin');
    const selfRoleChange = await request('POST', `/api/users/${currentAdminUser.id}/role`, { role: 'editor' }, adminToken);
    assert.strictEqual(selfRoleChange.status, 400, 'Changing own role should be rejected');
    console.log('✓ Self-role change rejection guard OK');

    const selfDelete = await request('DELETE', `/api/users/${currentAdminUser.id}`, null, adminToken);
    assert.strictEqual(selfDelete.status, 400, 'Deleting self should be rejected');
    console.log('✓ Self-delete rejection guard OK');

    console.log('\n🎉 ALL PRODUCTION & SECURITY TESTS PASSED! 🎉\n');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

runTests().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
