# Whatsapp Automation System 

A full-stack chat automation application with AI-powered responses.

## Project Features

- **AI-Powered Responses**: Automatic message responses using GEMINI API
- **Message History**: View all sent messages and AI responses in real-time
- **Database Management**: MongoDB collection to store all messages
- **Redis-BullMq**: Asynchronous request processing
- **Responsive UI**: Modern, user-friendly interface
- **Status Tracking**: Live message status tracking using socket (PENDING, SENT, FAILED)

## Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **React** - UI Library
- **Axios** - HTTP Client

## Project Structure

```
message/
├── server/                          # Backend
│   ├── controllers/                 # Request handlers and logic
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   └── webhookController.js
│   ├── middleware/                  # Request middleware
│   │   └── authMiddleware.js
│   ├── models/                      # Mongoose schemas
│   │   ├── Message.js
│   │   └── User.js
│   ├── queue/                       # Job queue implementation
│   │   └── messageQueue.js
│   ├── routes/                      # API route definitions
│   │   ├── authRoutes.js
│   │   └── messageRoutes.js
│   ├── services/                    # External integrations
│   │   └── llmService.js
│   ├── sockets/                     # WebSocket handling
│   │   └── socketService.js
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── server.js                   # Main server file
│
└── client/                          # Frontend
    ├── build/                       # Production build output
    ├── public/
    │   └── index.html              # HTML template
    ├── src/
    │   ├── components/
    │   │   ├── MessageForm.jsx
    │   │   └── MessageHistory.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.js
    ├── package.json
    └── package-lock.json
```

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- Redis (local or hosted)
- Gemini API key (`GEMINI_API_KEY`)

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

5. Start MongoDB

6. Start Redis

7. Start the server:
```bash
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

