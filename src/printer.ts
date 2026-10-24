import { SerialPort } from 'serialport';
import { config } from './config';

const OPEN_TIMEOUT_MS = 15000;

// Los trabajos van en fila: si llegan dos etiquetas a la vez, la segunda
// espera a que la primera termine en vez de pelearse por el puerto COM.
let queue: Promise<void> = Promise.resolve();

export function print(data: Buffer): Promise<void> {
  const job = queue.then(() => (config.dryRun ? dryRun(data) : writeToPort(data)));
  queue = job.catch(() => {});
  return job;
}

async function dryRun(data: Buffer): Promise<void> {
  console.log(`[dry-run] ${data.length} bytes`);
}

// Abre el puerto por trabajo y lo cierra al terminar: asi sobrevive a que la
// impresora se apague o se desempareje entre etiquetas.
function writeToPort(data: Buffer): Promise<void> {
  if (!config.printerPort) {
    return Promise.reject(new Error('PRINTER_PORT no esta configurado'));
  }

  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: config.printerPort,
      baudRate: config.baudRate,
      autoOpen: false,
    });

    const timer = setTimeout(() => {
      fail(new Error(`La impresora no respondio en ${config.printerPort}`));
    }, OPEN_TIMEOUT_MS);

    function fail(err: Error) {
      clearTimeout(timer);
      if (port.isOpen) port.close();
      reject(err);
    }

    port.open((openErr) => {
      if (openErr) return fail(openErr);
      port.write(data, (writeErr) => {
        if (writeErr) return fail(writeErr);
        port.drain((drainErr) => {
          if (drainErr) return fail(drainErr);
          clearTimeout(timer);
          port.close(() => resolve());
        });
      });
    });
  });
}
