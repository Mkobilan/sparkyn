const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkBucket() {
  console.log("Checking bucket files...");
  const { data, error } = await supabase.storage
    .from('generated-images')
    .list('', { limit: 5, sortBy: { column: 'created_at', order: 'desc' } });

  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No files found in 'generated-images' bucket.");
    return;
  }

  console.log(`Found ${data.length} files. Latest:`);
  data.forEach(file => {
    console.log(`- ${file.name} | Size: ${file.metadata?.size} bytes`);
  });
}

checkBucket();
