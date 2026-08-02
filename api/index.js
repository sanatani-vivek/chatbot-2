const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const app = express();
const PORT = 3000;

// Initialize the Google Gen AI SDK
// Ensure you have set the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// The old keyword bot logic is completely replaced by AI
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // 1. Set headers for Server-Sent Events (SSE) to stream data
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 2. Call the AI model and request a stream
            const responseStream = await ai.models.generateContentStream({
                    model: 'gemini-3.6-flash', 
// ...
            contents: userMessage,
            config: {
                systemInstruction: `You are a helpful, conversational AI assistant named Noob bot. 
                You were built by Vivek Kumar using Node.js and Express.js. 
                
            RULES:
                1. Talk like a real, casual person. Use conversational language.
                2. Keep your answers brief and to the point. 
                3. DO NOT write code, scripts, or technical tutorials. If asked for code, politely explain that you only chat.
                4. Do not use complex formatting or long lists.`,
            }
        });

        // 3. Stream each chunk of text to the client as it generates
        for await (const chunk of responseStream) {
            if (chunk.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
        }

        // 4. Close the connection when the AI finishes
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Error generating AI response:', error);

        // Handle errors gracefully depending on whether streaming started
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate response" });
        } else {
            res.write(`data: ${JSON.stringify({ error: "Generation interrupted" })}\n\n`);
            res.end();
        }
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Ensure your GEMINI_API_KEY environment variable is set.`);
    });
}

module.exports = app;