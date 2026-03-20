async function testCloudflare() {
  const accountId = '83f782b68b5d209f7bb9c4f527e0544c';
  const token = 'cfut_SmKKuNPZNQheNpFM6vfnTMDl12q1zq78cjjIrvWZ63458164';

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: 'a beautiful sunset over a glowing futuristic city' })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Failed:', response.status, text);
    return;
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log('Success! Image bytes:', arrayBuffer.byteLength);
}
testCloudflare();
