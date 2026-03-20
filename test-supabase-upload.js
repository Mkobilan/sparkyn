const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testUpload() {
  // 1x1 pixel base64 jpeg
  const base64Data = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const buffer = Buffer.from(base64Data, 'base64');
  
  const filename = `test_${Date.now()}.jpg`;
  
  console.log("Uploading...");
  const { data, error } = await supabase.storage
    .from('generated-images')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });
    
  if (error) {
    console.error("Upload Error:", error);
    return;
  }
  
  console.log("Uploaded successfully:", data);
  
  const { data: publicUrlData } = supabase.storage
    .from('generated-images')
    .getPublicUrl(filename);
    
  console.log("Public URL:", publicUrlData.publicUrl);
  
  // Test fetch
  const res = await fetch(publicUrlData.publicUrl);
  console.log("Fetch Status:", res.status);
  console.log("Content-Length:", res.headers.get('content-length'));
  console.log("Content-Type:", res.headers.get('content-type'));
}

testUpload();
