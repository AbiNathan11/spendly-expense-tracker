
const url = 'https://crkxvyhwmeesnmwucorr.supabase.co/rest/v1/';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3h2eWh3bWVlc25td3Vjb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzEzMDIsImV4cCI6MjA4MTI0NzMwMn0.uac6CxihWJirt98oIC_Wr-pkDKjxLZhI-3RQP85qhu0';

async function test() {
    try {
        console.log("Testing fetch to Supabase...");
        const res = await fetch(url, {
            headers: { 'apikey': apikey }
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data size:", JSON.stringify(data).length);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

test();
