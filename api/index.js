import app from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';

export default async function handler(request, response) {
  try {
    await connectDatabase();
    return app(request, response);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return response.status(500).json({ message: 'تعذر الاتصال بقاعدة البيانات' });
  }
}
