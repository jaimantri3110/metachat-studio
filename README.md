# MetaChat Studio

A real-time chat application with AI-powered conversation summaries, built with Next.js, Express, PostgreSQL, and Redis.

## Features

- 🚀 Real-time messaging with Socket.io
- 🤖 AI-powered conversation summaries using OpenRouter
- 💾 PostgreSQL for persistent message storage
- 📡 Redis pub/sub for scalable real-time updates
- 🎨 Modern, responsive UI with Next.js and TypeScript
- 🐳 Fully containerized with Docker

## Prerequisites

- Git
- Node.js 18+ (for local development)
- Docker and Docker Compose
- OpenRouter API key

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MetaChat-Studio

Set up environment variables
bash# Create .env file in the root directory
cp backend/.env.example .env

# Edit .env and add your OpenRouter API key
OPENROUTER_API_KEY=your_openrouter_api_key_here

Start with Docker Compose
bashdocker-compose up --build

Access the application

Open http://localhost:3000 in your browser
Start chatting! Messages appear in real-time
View the AI summary panel below the chat

Architecture

Frontend: Next.js + React + TypeScript

Real-time updates via Socket.io client
Responsive chat interface
AI summary display


Backend: Express + Socket.io + TypeScript

REST API endpoints for messages and summaries
WebSocket server for real-time communication
Redis pub/sub integration


Database: PostgreSQL

Users table
Messages table with foreign key relationships


Cache/Pub-Sub: Redis

Message broadcasting across server instances
Scalable real-time architecture


AI Integration: OpenRouter API

Generates one-sentence conversation summaries
Updates after each new message



API Endpoints

GET /api/messages - Fetch all messages
POST /api/messages - Create a new message
GET /api/summary - Get the latest AI summary

Testing the Application

Open multiple browser windows to http://localhost:3000
Send messages from different windows
Observe real-time message updates
Check the AI summary panel for conversation insights

Troubleshooting

Database connection issues: Ensure PostgreSQL is running and healthy
Redis connection issues: Check if Redis service is up
No AI summaries: Verify your OpenRouter API key is set correctly
Port conflicts: Modify ports in docker-compose.yml if needed

## Setup Instructions

1. Create a new directory: `mkdir MetaChat-Studio && cd MetaChat-Studio`
2. Create the folder structure as shown above
3. Copy each file content to its respective location
4. Get an OpenRouter API key from https://openrouter.ai
5. Create a `.env` file in the root with your API key
6. Run `docker-compose up --build`
7. Open http://localhost:3000 and start chatting!

The app will show messages in real-time and generate AI summaries after each message.