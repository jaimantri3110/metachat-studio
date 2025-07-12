import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import routes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Redis clients (one for pub, one for sub)
const redisPublisher = createClient({
  url: process.env.REDIS_URL
});
const redisSubscriber = createClient({
  url: process.env.REDIS_URL
});

// Middleware
app.use(cors());
app.use(express.json());

// Store latest AI summary in memory - FIXED: Using an object to maintain reference
const summaryState = {
  latestSummary: 'No messages yet.'
};

// Initialize database
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default user if not exists
    await pool.query(`
      INSERT INTO users (username) 
      VALUES ('Anonymous') 
      ON CONFLICT (username) DO NOTHING
    `);

    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Connect to Redis
async function connectRedis() {
  try {
    await redisPublisher.connect();
    await redisSubscriber.connect();
    
    // Subscribe to chat channel
    await redisSubscriber.subscribe('chat', (message) => {
      const msgData = JSON.parse(message);
      // Broadcast to all connected Socket.io clients
      io.emit('new-message', msgData);
    });

    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current summary when client connects
  socket.emit('summary-update', summaryState.latestSummary);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes - Pass the summaryState object and io instance
app.use('/api', routes(pool, redisPublisher, io, summaryState));

// Start server
const PORT = process.env.PORT || 4000;

async function start() {
  await initDatabase();
  await connectRedis();
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(console.error);