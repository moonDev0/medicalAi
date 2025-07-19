import React, { useState } from 'react';
import { getLLMResponse } from '../langchain/openrouterService';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const botText = await getLLMResponse(input);
    setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
    setInput('');
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>LangChain + OpenRouter Chatbot</h2>
      <div style={{ minHeight: 300, marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <b>{msg.sender}:</b> {msg.text}
          </div>
        ))}
        {loading && <p><i>Bot is typing...</i></p>}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
        style={{ width: '80%' }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
