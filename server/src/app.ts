import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import recommendationRoutes from './routes/recommendations';
import searchRoutes from './routes/search';
import friendsRoutes from './routes/friends';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://geld1-frontend.onrender.com',
  credentials: true
}));
app.use(express.json());

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/friends', friendsRoutes);

// Health check - Updated for production deployment
app.get('/api/health', (req, res) => {
  try {
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL ? 'Connected' : 'Missing'
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message || 'Unknown error'
    });
  }
});

// Database test
app.get('/api/db-test', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    
    // Test User table
    const userCount = await prisma.user.count();
    
    await prisma.$disconnect();
    
    res.json({ 
      status: 'OK', 
      message: 'Database connected successfully',
      userCount: userCount
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message || 'Database connection failed',
      error: error.toString()
    });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;