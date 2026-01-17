import app from './src/app.js';
import dotenv from 'dotenv';
import { connectDB } from './src/config/database.js';
import seedAdmin from './src/seeds/seedAdmin.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to DB first, then seed, then start server
connectDB().then(async () => {
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`✅ SkillWill Backend running on http://localhost:${PORT}`);
  });
});
