// Quick test: hit the local backend scan endpoint with a tiny test image
const testPayload = {
  imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  mimeType: "image/png"
};

async function test() {
  console.log("Sending request to backend...");
  try {
    const res = await fetch("http://localhost:5000/api/scan-screenshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}
test();
