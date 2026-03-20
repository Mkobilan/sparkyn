const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testArrayBuffer() {
  const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const filename = `test_ab_${Date.now()}.jpg`;
  
  console.log("Uploading via ArrayBuffer...");
  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(filename, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });
    
  if (error) {
    console.error("Upload failed:", error);
    return;
  }
  
  const { data: publicUrlData } = supabase.storage.from('generated-images').getPublicUrl(filename);
  console.log("Public URL:", publicUrlData.publicUrl);
  
  const res = await fetch(publicUrlData.publicUrl);
  console.log("Fetch size:", res.headers.get('content-length'));
}
testArrayBuffer();
