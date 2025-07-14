import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { Moon, Sun, Send, Trash2, MessageCircle, Wifi, WifiOff } from 'lucide-react';

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
  const [darkMode, setDarkMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [username, setUsername] = useState('User');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      
      // Request username assignment
      socketRef.current?.emit('request-username');
    });
    
    // Receive assigned username
    socketRef.current.on('username-assigned', (assignedUsername: string) => {
      console.log('Assigned username:', assignedUsername);
      setUsername(assignedUsername);
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

    // Listen for messages cleared event from server
    socketRef.current.on('messages-cleared', () => {
      console.log('Messages cleared notification received');
      setMessages([]);
      setSummary('No messages yet.');
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('new-message');
        socketRef.current.off('summary-update');
        socketRef.current.off('messages-cleared');
        socketRef.current.off('username-assigned');
        socketRef.current.disconnect();
      }
    };
  }, []);

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
        username: username  // Use the assigned username
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

  const deleteAllMessages = async () => {
    if (!confirm('Are you sure you want to delete all messages? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/messages`);
      // The backend will emit the messages-cleared event to all clients
      // We don't need to update state here as it will be done via Socket.io
    } catch (error) {
      console.error('Error deleting messages:', error);
      alert('Failed to delete messages. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-smooth">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                MetaChat Studio
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {username}
              </span>
              
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-smooth ${
                isConnected 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              <button
                onClick={deleteAllMessages}
                disabled={isDeleting || messages.length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete all messages"
              >
                <Trash2 className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isDeleting ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-smooth"
                title="Toggle dark mode"
              >
                {darkMode ? 
                  <Sun className="w-5 h-5 text-yellow-500" /> : 
                  <Moon className="w-5 h-5 text-gray-600" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Chat Container */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="group hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-3 transition-smooth">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {message.username}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Container */}
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Summary Panel */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl shadow-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                AI Summary
              </h2>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-xl p-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {summary}
              </p>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Powered by OpenRouter AI
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}