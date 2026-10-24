function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 4100),
  printerPort: process.env.PRINTER_PORT || '',
  baudRate: Number(process.env.PRINTER_BAUD_RATE || 9600),
  dryRun: process.env.PRINTER_DRY_RUN === 'true',
  jwtSecret: requireEnv('JWT_SECRET'),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
