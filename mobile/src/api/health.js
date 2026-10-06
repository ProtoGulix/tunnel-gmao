export async function getHealth() {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
  const response = await fetch(`${baseUrl}/health`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
