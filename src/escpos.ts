// Comandos ESC/POS para la MP210. Mismos bytes que arma la app en
// shelfsync-mobile/src/printing/escpos.ts, aqui con Buffer de Node.
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export const QR_PREFIX = 'shelfsync://item/';

export interface LabelData {
  id: string;
  code: string;
  name?: string;
  qty?: number | string;
  location?: string;
}

// El salto de linea final es obligatorio: sin el la impresora se queda
// esperando y no imprime nada.
function text(str: string): Buffer {
  return Buffer.concat([Buffer.from(str, 'utf8'), Buffer.from([LF])]);
}

function qr(data: string, size = 6): Buffer {
  const dataBytes = Buffer.from(data, 'utf8');
  const storeLen = dataBytes.length + 3;
  const pL = storeLen & 0xff;
  const pH = (storeLen >> 8) & 0xff;
  const ecM = 49;

  // prettier-ignore
  return Buffer.concat([
    Buffer.from([
      GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // modelo 2
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size, // tamano del modulo (1-16)
      GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, ecM, // correccion de errores M
      GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30,
    ]),
    dataBytes,
    Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]), // imprimir el QR guardado
  ]);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTime(date: Date): string {
  const h = date.getHours();
  const ampm = h < 12 ? 'a.m.' : 'p.m.';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(h % 12 || 12)}:${pad2(date.getMinutes())} ${ampm}`;
}

export function buildLabel(data: LabelData): Buffer {
  // prettier-ignore
  return Buffer.concat([
    Buffer.from([
      ESC, 0x40, // init
      ESC, 0x61, 1, // centrar
      ESC, 0x45, 1, // negrita on
      GS, 0x21, 0x11, // doble ancho/alto
    ]),
    text('INVENTARIO'),
    Buffer.from([GS, 0x21, 0x00, ESC, 0x45, 0]), // tamano normal, negrita off
    text('------------------------'),
    Buffer.from([ESC, 0x61, 0]), // izquierda
    text(`CODIGO:    ${data.code}`),
    text(`Nombre:    ${data.name || '-'}`),
    text(`Cantidad:  ${data.qty ?? '-'}`),
    text(`Ubicacion: ${data.location || '-'}`),
    text(`Fecha:     ${formatDateTime(new Date())}`),
    text(' '),
    Buffer.from([ESC, 0x61, 1]), // centrar el QR
    qr(`${QR_PREFIX}${data.id}`),
    Buffer.from([ESC, 0x64, 3, GS, 0x56, 0x00]), // avanzar 3 lineas + corte total
  ]);
}
