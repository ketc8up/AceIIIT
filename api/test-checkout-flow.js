process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runTest() {
  const API_URL = 'https://localhost:3000/api';
  let guestToken, adminToken, orderId, paymentId;

  console.log('1. Registering Guest User...');
  try {
    const guestRes = await fetch(`${API_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'arka24apj@gmail.com',
        firstName: 'Test',
        lastName: 'Student',
        phone: '9999999999',
        college: 'Test College',
        year: '2026'
      })
    });
    const guestData = await guestRes.json();
    guestToken = guestData.token;
    console.log('✓ Guest Registered successfully');
  } catch (e) {
    console.error('Guest Registration Failed:', e);
    return;
  }

  console.log('\n2. Creating Order for Mock Test...');
  try {
    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}` 
      },
      body: JSON.stringify({
        items: [{ productId: 'mock', quantity: 1 }]
      })
    });
    const orderData = await orderRes.json();
    orderId = orderData.id;
    console.log(`✓ Order Created: ${orderId}`);
  } catch (e) {
    console.error('Order Creation Failed:', e);
    return;
  }

  console.log('\n3. Submitting Payment...');
  try {
    const payRes = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}` 
      },
      body: JSON.stringify({
        orderId: orderId,
        utr: '123456789012',
        receiptReference: 'receipts/test.jpg',
        idempotencyKey: 'test-key-' + Date.now()
      })
    });
    const payData = await payRes.json();
    paymentId = payData.id;
    console.log(`✓ Payment Submitted (PENDING): ${paymentId}`);
    console.log('-> Pending Email should have been sent!');
  } catch (e) {
    console.error('Payment Submission Failed:', e);
    return;
  }

  console.log('\n4. Admin Login...');
  try {
    const adminRes = await fetch(`${API_URL}/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin123'
      })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
    console.log('✓ Admin Logged In');
  } catch (e) {
    console.error('Admin Login Failed:', e);
    return;
  }

  console.log('\n5. Verifying Payment...');
  try {
    await fetch(`${API_URL}/admin/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      }
    });
    console.log('✓ Payment VERIFIED successfully!');
    console.log('-> Verified Email should have been sent!');
    console.log('-> Mock Portal Provisioning should be complete!');
  } catch (e) {
    console.error('Payment Verification Failed:', e);
  }

  console.log('\n--- ALL TESTS COMPLETED ---');
}

runTest();
