# Chat AI API

A backend API for an AI chat application that integrates with Stream Chat for real-time messaging and uses AI models for generating responses.

## Features

- User registration and authentication
- Real-time chat using Stream Chat
- AI-powered responses using DeepSeek Chat
- Persistent chat history using PostgreSQL
- TypeScript support with full type safety
- RESTful API endpoints

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Stream Chat account and API credentials
- DeepSeek API key

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=8000
DATABASE_URL=your_postgresql_database_url
STREAM_API_KEY=your_stream_chat_api_key
STREAM_API_SECRET=your_stream_chat_api_secret
OPENROUTER_FREE_API_KEY=your_openrouter_api_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-ai-api.git
cd chat-ai-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

## Development

To run the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### POST /register-user
Register a new user in the system.

Request body:
```json
{
  "name": "User Name",
  "email": "user@example.com"
}
```

### POST /chat
Send a message to the AI and get a response.

Request body:
```json
{
  "message": "Your message here",
  "userId": "user_id"
}
```

### POST /get-messages
Retrieve chat history for a user.

Request body:
```json
{
  "userId": "user_id"
}
```

## Technologies Used

- TypeScript
- Express.js
- Stream Chat
- Drizzle ORM
- PostgreSQL
- Neon Database
- DeepSeek AI

## License

MIT 