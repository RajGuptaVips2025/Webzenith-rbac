export async function waitForCookie(name: string, timeout = 2000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.trim().startsWith(name + "="));

    if (hasCookie) return true;

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
}
