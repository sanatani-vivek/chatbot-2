// UI toggle logic
const chatToggler = document.getElementById('chat-toggler');
const closeBtn = document.getElementById('close-chat');
const chatWrapper = document.getElementById('chat-wrapper');
const chatOverlay = document.getElementById('chat-overlay');

function openChat() {
    chatWrapper.classList.add('show');
    chatOverlay.classList.add('show');
    document.getElementById('user-input').focus();
}

function closeChat() {
    chatWrapper.classList.remove('show');
    chatOverlay.classList.remove('show');
}

chatToggler.addEventListener('click', openChat);
closeBtn.addEventListener('click', closeChat);
chatOverlay.addEventListener('click', closeChat);

// chat logic
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

const userSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const botSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

function addMessage(sender, text = '') {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', sender);

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = sender === 'user' ? userSVG : botSVG;

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.innerText = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    return bubble;
}

function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', 'bot');
    wrapper.id = 'typing-indicator';

    wrapper.innerHTML = `
        <div class="avatar">${botSVG}</div>
        <div class="typing-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;

    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage('user', message);
    userInput.value = '';
    userInput.disabled = true;
    sendBtn.disabled = true;

    showTyping();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error('Network response failure');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let botBubble = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Retain incomplete line in buffer for next chunk
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') break;

                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.text) {
                            // Create the bot bubble on the first incoming text chunk
                            if (!botBubble) {
                                hideTyping();
                                botBubble = addMessage('bot', '');
                            }
                            botBubble.innerText += parsed.text;
                            chatBox.scrollTop = chatBox.scrollHeight;
                        }
                    } catch (parseErr) {
                        console.error('SSE JSON parse error:', parseErr, dataStr);
                    }
                }
            }
        }

        if (!botBubble) {
            hideTyping();
            addMessage('bot', 'No response received.');
        }

    } catch (err) {
        hideTyping();
        console.error(err);
        addMessage('bot', 'Something went wrong, try again.');
    } finally {
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
}