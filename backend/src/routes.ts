import { Router } from 'express';
import { Pool } from 'pg';
import { Server } from 'socket.io';
import axios from 'axios';

export default function routes(
  pool: Pool, 
  redisPublisher: any,  // Use 'any' to avoid type conflicts
  io: Server,
  summaryState: { latestSummary: string } // FIXED: Direct object reference
) {
  const router = Router();

  // Get all messages
  router.get('/messages', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT m.id, m.content, m.created_at, u.username 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Create new message
  router.post('/messages', async (req, res) => {
    try {
      const { content, username = 'Anonymous' } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Get or create user
      let userResult = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (userResult.rows.length === 0) {
        userResult = await pool.query(
          'INSERT INTO users (username) VALUES ($1) RETURNING id',
          [username]
        );
      }

      const userId = userResult.rows[0].id;

      // Insert message
      const messageResult = await pool.query(
        'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING id, content, created_at',
        [userId, content]
      );

      const newMessage = {
        ...messageResult.rows[0],
        username
      };

      // Publish to Redis
      await redisPublisher.publish('chat', JSON.stringify(newMessage));

      // Get all messages for AI summary
      const allMessages = await pool.query(`
        SELECT m.content, u.username 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC
      `);

      // Generate AI summary
      if (process.env.OPENROUTER_API_KEY) {
        try {
          const conversation = allMessages.rows
            .map(msg => `${msg.username}: ${msg.content}`)
            .join('\n');

          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'google/gemini-flash-1.5-8b', // Free model
              messages: [
                {
                  role: 'system',
                  content: 'Summarize this chat conversation in one sentence. Be concise.'
                },
                {
                  role: 'user',
                  content: conversation
                }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000', // Optional but recommended
                'X-Title': 'MetaChat Studio' // Optional
              }
            }
          );

          const summary = response.data.choices[0].message.content;
          summaryState.latestSummary = summary; // FIXED: Direct assignment
          console.log('AI Summary updated:', summary); // Added logging
          
          // Emit summary update to all connected clients
          io.emit('summary-update', summary);
        } catch (error) {
          console.error('AI summary error:', error);
          if (axios.isAxiosError(error) && error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('OpenRouter API Key (first 10 chars):', process.env.OPENROUTER_API_KEY?.substring(0, 10));
          }
        }
      }

      res.json(newMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  });

  // Get latest AI summary
  router.get('/summary', (req, res) => {
    res.json({ summary: summaryState.latestSummary });
  });

  return router;
}