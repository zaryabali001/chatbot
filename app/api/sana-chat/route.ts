export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch("https://sana.emrchains.com/api3/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/plain; charset=utf-8",
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")
    const data = contentType && contentType.includes("application/json") 
      ? await response.json() 
      : await response.text()
    
    return new Response(JSON.stringify({ data }), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to reach Sana API" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
