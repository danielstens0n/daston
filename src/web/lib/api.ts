export async function fetchTheme(): Promise<unknown> {
  const res = await fetch('/api/theme');
  return res.json();
}
