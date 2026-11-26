import 'dotenv/config';
import { app } from './app.js';

const port = Number(process.env.PORT || 4001);

app.listen(port, () => {
  console.log(`API FinControl rodando em http://localhost:${port}`);
});
