# MetaChat Studio v1.0 (UPDATED)

A modern real-time chat application with AI-powered conversation summaries, built with Next.js, Express, PostgreSQL, and Redis.


## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.io
- **AI-Powered Summaries**: Automatic conversation summaries using OpenRouter AI (Free Gemini model)
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes
- **Unique User Identification**: Each client gets a unique username (User1, User2, etc.)
- **Chat History Management**: Delete all messages with synchronized updates across clients
- **PostgreSQL Storage**: Persistent message storage with relational database
- **Redis Pub/Sub**: Scalable real-time message broadcasting
- **Docker Support**: Fully containerized for easy deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Socket.io Client
- **Backend**: Express.js, TypeScript, Socket.io, PostgreSQL, Redis
- **AI Integration**: OpenRouter API (Gemini Flash 1.5 8B - Free Model)
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- Git
- Node.js 18+ (for local development)
- Docker and Docker Compose
- OpenRouter API key (free tier available)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MetaChat-Studio


2. **Set up environment variables**
bash# Create .env file in the root directory
cp backend/.env.example .env

# Edit .env and add your OpenRouter API key
OPENROUTER_API_KEY=your_openrouter_api_key_here

3. **Start with Docker Compose**
bashdocker-compose up --build

4. **Access the application**

Open http://localhost:3000 in your browser
Start chatting! Messages appear in real-time
View the AI summary panel below the chat

🏗️ Architecture
Services

Frontend (Port 3000): Next.js application with real-time UI
Backend (Port 4000): Express API server with Socket.io
PostgreSQL (Port 5432): Primary database for users and messages
Redis (Port 6379): Pub/Sub for real-time message broadcasting

🌟 Features in Detail
Real-time Messaging

WebSocket connection for instant updates
Message broadcasting via Redis pub/sub
Automatic reconnection handling

AI Summaries

Uses Google's Gemini Flash 1.5 8B (free model)
Generates one-sentence summaries
Updates after each new message
Synchronized across all connected clients

User Management

Automatic username assignment (User1, User2, etc.)
Username persists for the session
Displayed in the header and with each message

Dark Mode

System-wide dark mode toggle
Smooth transitions

Chat Management

Delete all messages with one click
Confirmation dialog for safety
Synchronized deletion across all clients
AI summary resets automatically

📡 API Endpoints

GET /api/messages - Fetch all messages
POST /api/messages - Create a new message
DELETE /api/messages - Delete all messages
GET /api/summary - Get the latest AI summary

🐳 Docker Configuration
The application uses Docker Compose with:

Custom Dockerfiles for frontend and backend
Health checks for databases
Volume persistence for PostgreSQL
Hot reload in development

🔐 Security Considerations

Never commit .env files
Use environment variables for sensitive data
API keys should be kept secure
Consider rate limiting for production

🚀 Deployment Options

Railway.app - Simple deployment with automatic builds
Render.com - Free tier available with PostgreSQL
DigitalOcean App Platform - Scalable container hosting
Self-hosted VPS - Full control with Docker

🤝 Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

📝 Version History
v1.0 (Current)

Modern UI with Tailwind CSS
Dark mode support
Unique usernames for each client
Synchronized chat deletion
Free AI model integration
Improved error handling
Responsive design

Future Enhancements

Private rooms/channels
User authentication
Message reactions
Typing indicators

🐛 Troubleshooting
Common Issues
Backend not starting: Check if PostgreSQL and Redis are running
bashdocker-compose ps
docker-compose logs backend
AI summaries not working: Verify your OpenRouter API key
bashecho $OPENROUTER_API_KEY
Port conflicts: Change ports in docker-compose.yml
Database connection issues: Restart services