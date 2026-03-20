async function test() {
   const urls = [
       "https://image.pollinations.ai/prompt/Test?width=768&height=1344&nologo=true",
       "https://image.pollinations.ai/prompt/Test?width=768&height=1344&nologo=true&model=turbo"
   ];
   for (const url of urls) {
       console.log("Fetching:", url);
       try {
           const res = await fetch(url);
           console.log("Status:", res.status);
       } catch(e) {}
   }
}
test();
