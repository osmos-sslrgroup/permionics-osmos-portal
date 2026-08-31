async function run() {
  const loginRes = await fetch("https://permionics-insights-hub.onrender.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: 'Perma@digi1976', remember: true })
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(';')[0];

  const chatRes = await fetch("https://permionics-insights-hub.onrender.com/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookie
    },
    body: JSON.stringify({ message: "Hello", history: [], contextIds: [] })
  });

  console.log("Chat Status:", chatRes.status);
  console.log("Chat Response:", await chatRes.text());
}
run().catch(console.error);
