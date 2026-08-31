import fs from 'fs';
import path from 'path';

async function run() {
  const loginRes = await fetch('https://permionics-insights-hub.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Perma@digi1976', remember: true })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed', await loginRes.text());
    return;
  }
  
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Got cookie:', cookies);
  
  // Create a dummy PDF
  const dummyPath = path.resolve('dummy.pdf');
  fs.writeFileSync(dummyPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000213 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n284\n%%EOF');
  
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(dummyPath)]), 'dummy.pdf');
  
  const uploadRes = await fetch('https://permionics-insights-hub.onrender.com/api/assistant/upload', {
    method: 'POST',
    headers: {
      'Cookie': cookies || ''
    },
    body: formData
  });
  
  console.log('Upload Status:', uploadRes.status);
  console.log('Upload Response:', await uploadRes.text());
}

run();
