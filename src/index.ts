import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requireAuth } from './auth';
import { buildLabel, LabelData } from './escpos';
import { print } from './printer';

const app = express();
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, printerPort: config.printerPort, dryRun: config.dryRun });
});

function parseLabel(body: unknown): LabelData | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.id !== 'string' || !b.id) return null;
  if (typeof b.code !== 'string' || !b.code) return null;
  return {
    id: b.id,
    code: b.code,
    name: typeof b.name === 'string' ? b.name : undefined,
    qty: typeof b.qty === 'number' || typeof b.qty === 'string' ? b.qty : undefined,
    location: typeof b.location === 'string' ? b.location : undefined,
  };
}

app.post('/print/label', requireAuth, async (req, res) => {
  const label = parseLabel(req.body);
  if (!label) {
    res.status(400).json({ message: 'Se requieren id y code' });
    return;
  }
  try {
    await print(buildLabel(label));
    console.log(`Etiqueta impresa: ${label.code} ${label.name ?? ''}`);
    res.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Error al imprimir ${label.code}: ${message}`);
    res.status(503).json({ message });
  }
});

app.listen(config.port, () => {
  const target = config.dryRun ? 'dry-run' : config.printerPort || '(sin PRINTER_PORT)';
  console.log(`shelfsync-printer en http://localhost:${config.port} -> ${target}`);
});
