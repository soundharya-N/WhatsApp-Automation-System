# 💬 Whatsapp Automation System - MERN Stack

A full-stack chat automation application with AI-powered responses using LLM (Large Language Models).

## 🎯 Project Features

- **AI-Powered Responses**: Automatic message responses using OpenAI GPT
- **Message History**: View all sent messages and AI responses in real-time
- **Database Management**: MongoDB collection to store all messages
- **RESTful API**: POST endpoint for message submission
- **Responsive UI**: Modern, user-friendly interface
- **Status Tracking**: Track message status (PENDING, SENT, FAILED)

## 📋 Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **OpenAI API** - LLM Integration
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React 18** - UI Library
- **Axios** - HTTP Client
- **CSS3** - Styling

## 📁 Project Structure

```
message/
├── server/                          # Backend
│   ├── models/
│   │   └── Message.js              # MongoDB schema
│   ├── controllers/
│   │   └── messageController.js    # API logic
│   ├── routes/
│   │   └── messageRoutes.js        # API routes
│   ├── services/
│   │   └── llmService.js           # LLM integration
│   ├── package.json
│   ├── server.js                   # Main server file
│   └── .env.example
│
└── client/                          # Frontend
    ├── src/
    │   ├── components/
    │   │   ├── MessageForm.jsx     # Form to submit messages
    │   │   └── MessageHistory.jsx  # Table with message history
    │   ├── App.jsx                 # Main component
    │   ├── App.css                 # Styling
    │   └── index.js                # Entry point
    ├── public/
    │   └── index.html              # HTML template
    └── package.json
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- Redis (local or hosted)
- Gemini API key (`GEMINI_API_KEY`) or alternative `LLM_API_KEY`

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/message_chat
PORT=5000

GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_OUTPUT_TOKENS=1024
GEMINI_TEMPERATURE=0.7
GEMINI_API_HOST=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_API_KEY=your_gemini_api_key_here
# or use LLM_API_KEY=your_openai_api_key_here

REDIS_HOST=localhost
REDIS_PORT=6379
# Optional: REDIS_URL=redis://localhost:6379

JWT_SECRET=replace_with_a_strong_secret
```

5. Start MongoDB (if running locally):
```bash
# Windows
mongod

# macOS/Linux
mongod
```

6. Start the server:
```bash
# Development with hot reload
npm run dev

# Production
npm start
```

Server will run on: `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Client will run on: `http://localhost:3000`
