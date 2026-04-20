import { createServer } from 'node:net';

export async function getAvailablePort(start = 3847, end = 4100): Promise<number> {
  for (let port = start; port < end; port++) {
    const ok = await canListen(port);
    if (ok) {
      return port;
    }
  }
  throw new Error(`No free TCP port found between ${start} and ${end - 1}`);
}

function canListen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}
