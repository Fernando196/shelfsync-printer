import { SerialPort } from 'serialport';

// Lista los puertos COM para encontrar el de la MP210 emparejada.
SerialPort.list().then((ports) => {
  if (!ports.length) console.log('No hay puertos COM');
  for (const p of ports) {
    // friendlyName solo existe en Windows y no viene en los tipos
    const name = (p as { friendlyName?: string }).friendlyName ?? p.manufacturer ?? '';
    console.log(`${p.path}  ${name}  ${p.pnpId ?? ''}`);
  }
});
