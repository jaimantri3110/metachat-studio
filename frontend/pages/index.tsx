import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

interface Message {
  id: number;
  content: string;
  username: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [summary, setSummary] = useState('No messages yet.');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial messages and summary
  useEffect(() => {
    fetchMessages();
    fetchSummary();
  }, []);

  // Setup Socket.io connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
      
      // Debug: log all events
      if (socketRef.current) {
        (socketRef.current as any).onAny((event: string, ...args: any[]) => {
          console.log('Socket.io event:', event, args);
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketRef.current.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for summary updates
    socketRef.current.on('summary-update', (newSummary: string) => {
      console.log('Received summary update:', newSummary);
      setSummary(newSummary);
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('new-message');
        socketRef.current.off('summary-update');
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/summary`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/messages`, {
        content: inputValue,
        username: 'User'
      });
      console.log('Message sent, response:', response.data);
      setInputValue('');
      
      // Fetch summary after a short delay to ensure AI processing is complete
      setTimeout(() => {
        fetchSummary();
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>MetaChat Studio</h1>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </header>

      <main className="main">
        <div className="chat-container">
          <div className="messages">
            {messages.map((message) => (
              <div key={message.id} className="message">
                <strong>{message.username}:</strong> {message.content}
                <span className="timestamp">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="message-input"
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </div>

        <div className="summary-panel">
          <h2>AI Summary</h2>
          <p>{summary}</p>
        </div>
      </main>
    </div>
  );
}