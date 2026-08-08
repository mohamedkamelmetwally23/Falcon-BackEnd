import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { seedAdmin } from './controllers/authController.js';

const port = process.env.PORT || 5000;

connectDatabase()
  .then(seedAdmin)
  .then(() => app.listen(port, () => console.log(`API running on port ${port}`)))
  .catch(error => {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  });
