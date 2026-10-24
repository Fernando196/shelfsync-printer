# shelfsync-printer

API local (Express + TS) que imprime las etiquetas de ShelfSync en la MP210.
Corre en la laptop que tiene la impresora emparejada; la app/web le manda los
datos y recibe 200 cuando la etiqueta ya salio.

## Arranque

1. Emparejar la MP210 por Bluetooth en Windows.
2. `npm run ports` y buscar el puerto "Serie estandar sobre vinculo Bluetooth" (COMx).
3. `cp .env.example .env` y llenar `PRINTER_PORT` y `JWT_SECRET` (el mismo de shelfsync-api).
4. `npm run dev`

Para probar sin impresora: `PRINTER_DRY_RUN=true`.

## Endpoints

- `GET /health` → `{ ok, printerPort, dryRun }`
- `POST /print/label` (Bearer JWT de la app)
  body `{ id, code, name?, qty?, location? }` → `200 { ok: true }`,
  `400` datos incompletos, `401` sin token, `503` la impresora fallo `{ message }`.
