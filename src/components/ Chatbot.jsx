import React, { useState, useRef, useEffect } from 'react';
import { getLLMResponse } from '../langchain/openrouterService';
import { retrieveRelevantAdvice } from '../langchain/ragHelper';
import { FaPaperPlane, FaUserMd, FaUser, FaSpinner } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const ChatContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  background: white;
  display: flex;
  flex-direction: column;
  height: 80vh;
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  max-width: 70%;
  margin-bottom: 15px;
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  
  ${props => props.sender === 'bot' ? `
    align-self: flex-start;
    background: white;
    border-top-left-radius: 4px;
    color: #333;
    border: 1px solid #e1e1e1;
  ` : `
    align-self: flex-end;
    background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
    color: white;
    border-top-right-radius: 4px;
  `}
`;

const SenderIcon = styled.div`
  position: absolute;
  top: -10px;
  ${props => props.sender === 'bot' ? 'left: -10px;' : 'right: -10px;'}
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  ${props => props.sender === 'bot' ? `
    background: #4b6cb7;
    color: white;
  ` : `
    background: white;
    color: #4b6cb7;
    border: 1px solid #4b6cb7;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px;
  background: white;
  border-top: 1px solid #e1e1e1;
`;

const InputField = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #e1e1e1;
  border-radius: 24px;
  outline: none;
  font-size: 16px;
  transition: all 0.3s;
  
  &:focus {
    border-color: #4b6cb7;
    box-shadow: 0 0 0 2px rgba(75, 108, 183, 0.2);
  }
`;

const SendButton = styled.button`
  margin-left: 10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  animation: ${pulse} 1.5s infinite;
`;

const DoctorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function MedicalChatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm Dr. AI. How can I assist you with your medical concerns today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const retrievedAdvice = await retrieveRelevantAdvice(input);
      
      const prompt = `You are a professional medical assistant. Provide clear, concise advice based on the following information.
      
Patient Input: "${input}"

Relevant Medical Information: "${retrievedAdvice}"

Provide a professional response that:
1. Acknowledges the patient's concern
2. References the relevant medical information when appropriate
3. Offers clear advice
4. Suggests when to seek in-person medical attention
5. Uses simple, non-alarming language

Response:`;
      
      const botText = await getLLMResponse(prompt);
      setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "I'm sorry, I encountered an error processing your request. Please try again later." 
      }]);
      console.error("Chatbot error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContainer style={{marginTop:'60px'}}>
      <ChatHeader>
        <DoctorAvatar>
          <FaUserMd size={20} />
        </DoctorAvatar>
        <div>
          <h2 style={{ margin: 0 }}>Dr. AI Assistant</h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9em' }}>
            {loading ? 'Typing...' : 'Online'}
          </p>
        </div>
      </ChatHeader>
      
      <ChatBody>
        {messages.map((msg, i) => (
          <Message key={i} sender={msg.sender}>
            <SenderIcon sender={msg.sender}>
              {msg.sender === 'bot' ? <FaUserMd size={10} /> : <FaUser size={10} />}
            </SenderIcon>
            {msg.text}
          </Message>
        ))}
        
        {loading && (
          <TypingIndicator>
            <FaSpinner className="fa-spin" />
            <span>Dr. AI is typing...</span>
          </TypingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </ChatBody>
      
      <InputContainer>
        <InputField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Describe your symptoms or ask a medical question..."
          disabled={loading}
        />
        <SendButton onClick={sendMessage} disabled={loading || !input.trim()}>
          <FaPaperPlane size={18} />
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}