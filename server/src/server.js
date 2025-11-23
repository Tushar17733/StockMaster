// src/server.js
import app from './app.js';
import cors from 'cors';
import { config } from './config/index.js';
import connectDB from './utils/database.js';

const PORT = config.port;

app.use(cors());

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 StockMaster API server running on port ${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});