
async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@shopwave.com',
        password: 'Admin@1234'
      })
    });
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('✅ Login data:', data);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testLogin();
