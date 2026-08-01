const express = require('express');
const app = express();
const PORT = 3000;
const path = require('path'); 

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function getBotResponse(msg) {
    msg = msg.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return "Hey there! How can I help you today?";
    }

    if (msg.includes('how are you')) {
        return "Doing good, just running on a node server somewhere. What's up?";
    }

    if (msg.includes('bye') || msg.includes('goodbye')) {
        return "See ya, take care!";
    }

    if (msg.includes('help')) {
        return "I'm a pretty basic bot for now, try greeting me or asking how I'm doing.";
    }

    if (msg.includes('name')) {
        return "I'm Noob bot, nice to meet you.";
    }

    if (msg.includes('thank')) {
        return "No problem!";
    }

    if (msg.includes('weather')) {
        return "I can't check the weather yet, sorry. Maybe in a future update.";
    }

    if (msg.includes('joke')) {
        return "Why do programmers prefer dark mode? Because light attracts bugs.";
    }

    if (msg.includes('time')) {
        return `Server time right now is ${new Date().toLocaleTimeString()}.`;
    }

    if (msg.includes('date')) {
        return `Today's date is ${new Date().toLocaleDateString()}.`;
    }

    if (msg.includes('age') || msg.includes('old')) {
        return "I don't really have an age, I'm just some code that runs when you send a message.";
    }

    if (msg.includes('who made you') || msg.includes('creator')) {
        return "I was built by Vivek Kumar using Node.js and Express.js.";
    }

    if (msg.includes('love')) {
        return "Aw, that's sweet. But I'm just a bot, remember?";
    }

    if (msg.includes('bored')) {
        return "Try asking me for a joke, that might help.";
    }

    if (msg.includes('sad')) {
        return "Sorry to hear that. Hope things get better soon.";
    }

    return "Hmm, not sure what you mean by that. Can you rephrase?";
}

app.post('/api/chat', (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
    }

    const reply = getBotResponse(userMessage);

    // small delay so it doesn't feel instant/robotic
    setTimeout(() => {
        res.json({ reply });
    }, 800);
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;