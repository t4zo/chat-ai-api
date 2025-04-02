import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { StreamChat } from 'stream-chat'
// import OpenAI from 'openai'
import { db } from './config/database.js'
import { chats, users } from './db/schema.js'
import { eq } from 'drizzle-orm'
import { ChatCompletionMessage } from 'openai/resources'

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

const chatClient = StreamChat.getInstance(process.env.STREAM_API_KEY!, process.env.STREAM_API_SECRET!)
// const openai = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: process.env.OPENROUTER_FREE_API_KEY })

// Register user with Stream Chat
app.post('/register-user', async (req: Request, res: Response): Promise<any> => {
    const { name, email } = req.body || {}

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and Email are required' })
    }

    try {
        const userId = email.replace(/[^a-zA-Z0-9_-]/g, '_')

        const userResponse = await chatClient.queryUsers({ id: { $eq: userId } })

        if(!userResponse.users.length) {
            await chatClient.upsertUser({
                id: userId,
                name,
                email,
                role: 'user',
            })
        }

        // Check for existing user in database
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId))

        if(!existingUser.length) {
            console.log(`User ${userId} does not exist in the database. Adding user`)
            await db.insert(users).values({ userId, name, email })
        }

        return res.status(200).json({ userId, name, email })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/chat', async (req: Request, res: Response): Promise<any> => {
    const { message, userId } = req.body || {}

    if (!message || !userId) {
        return res.status(400).json({ error: 'Message and User are required' })
    }

    try {
        const userResponse = await chatClient.queryUsers({ id: userId })
        if(!userResponse.users.length) {
            return res.status(404).json({ error: 'User not found. Please register first' })
        }

        // Check for existing user in database
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId))

        if(!existingUser.length) {
            return res.status(404).json({ error: 'User not found in database, please register' })
        }

        // const completion = await openai.chat.completions.create({
        //     model: 'deepseek-chat',
        //     messages: [{ role: 'user', content: message }]
        // })

        const responseBlob = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_FREE_API_KEY}`
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-chat-v3-0324:free",
                "messages": [{ "role": "user", "content": message }],
                "stream": false
              })
        })

        if(!responseBlob.ok) {
            throw new Error(`Response status: ${responseBlob.status}`);
        }

        const completion = await responseBlob.json()

        const aiMessage = completion.choices[0].message?.content ?? 'Sem resposta da AI'

        // Save chat to database
        await db.insert(chats).values({ userId, message, reply: aiMessage })

        const AI_BOT_USER_ID = 'ai_bot'
        const chatChannel = chatClient.channel('messaging', `chat-${userId}`, {
            name: 'AI Chat',
            created_by_id: AI_BOT_USER_ID
        })

        await chatChannel.create()
        await chatChannel.sendMessage({ user_id: AI_BOT_USER_ID, text: aiMessage })

        res.status(200).json({ reply: aiMessage })
    } catch (error) {
        console.error('Error generating AI response', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})


app.post('/get-messages', async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.body || {}
    if(!userId) {
        return res.status(400).json({ error: 'UserId required' })
    }

    try {
        const chatHistory = await db
            .select()
            .from(chats)
            .where(eq(chats.userId, userId))

        res.status(200).json({ messages: chatHistory })
    } catch (error) {
        console.error('Error fetching chat history', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})