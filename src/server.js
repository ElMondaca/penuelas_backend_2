import 'dotenv/config';
import app from './app.js';
import { testDatabaseConnection } from './config/database.js';

const port = Number(process.env.PORT || 3000);

try {
  await testDatabaseConnection();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Gym Peñuelas API escuchando en puerto ${port}`);
  });
} catch (error) {
  console.error('No fue posible conectar con MySQL:', error.message);
  process.exit(1);
}
