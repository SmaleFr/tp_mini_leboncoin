import app from './app.js';

const PORT = Number.parseInt(process.env.PORT ?? '4002', 10);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Media service listening on http://localhost:${PORT}`);
});

