// src/components/Chatbot.js
import React, { useState, useRef, useEffect } from 'react';
import { getLLMResponse } from '../langchain/openrouterService';
import { retrieveRelevantAdvice } from '../langchain/ragHelper';
import {
  getUserGenotype,
  getUserVitals,
  getUserBloodPressure,
  getDoctorAvailability,
  bookAppointment,
} from '../services/emrService';
import { FaPaperPlane, FaUserMd, FaUser, FaSpinner } from 'react-icons/fa';
import styled, { keyframes } from 'styled-components';

/* ===================== styles (your original look & feel) ===================== */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
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

  &:hover { transform: scale(1.05); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  animation: ${pulse} 1.5s infinite;
`;

const SpinningIcon = styled(FaSpinner)`
  animation: ${spin} 1s linear infinite;
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

/* ===================== logic/helpers ===================== */

// Dummy logged-in user
const userId = 1;

/** Format a list of doctors [{name, specialty}] nicely */
function formatDoctorList(docs) {
  if (!docs || docs.length === 0) return 'No doctors available.';
  return docs.map(d => `${d.name}${d.specialty ? ` (${d.specialty})` : ''}`).join(', ');
}

/**
 * Try to resolve EMR-style queries from local services.
 * Returns either:
 *  - { text: string, context?: string }  OR
 *  - null (to fall back to LLM)
 */
async function handleUserQuery(input) {
  const lower = input.toLowerCase().trim();

  // genotype
  if (lower.includes('genotype')) {
    const value = getUserGenotype(userId);
    const text = `Your genotype is: ${value}.`;
    return { text, context: `Genotype: ${value}` };
  }

  // blood pressure
  if (lower.includes('blood pressure') || lower.includes('bp')) {
    const bp = getUserBloodPressure(userId);
    const text = `Your blood pressure is: ${bp}.`;
    return { text, context: `Blood pressure: ${bp}` };
  }

  // vitals
  if (lower.includes('vitals') || lower.includes('my vitals')) {
    const v = getUserVitals(userId);
    const text =
      `Here are your vitals:\n` +
      `• Heart Rate: ${v.heartRate} bpm\n` +
      `• Temperature: ${v.temperature}\n` +
      `• Weight: ${v.weight}`;
    const context = `Vitals -> Heart Rate: ${v.heartRate} bpm; Temperature: ${v.temperature}; Weight: ${v.weight}`;
    return { text, context };
  }

  // available doctors (today/tomorrow)
  if (lower.includes('available doctors')) {
    const isTomorrow = lower.includes('tomorrow');
    const target = isTomorrow ? new Date(Date.now() + 86400000) : new Date();
    const date = target.toISOString().split('T')[0];
    const docs = getDoctorAvailability(date);
    const text = `${isTomorrow ? 'Doctors available tomorrow' : 'Doctors available today'}: ${formatDoctorList(docs)}`;
    return { text, context: `Doctor availability for ${date}: ${formatDoctorList(docs)}` };
  }

  // book pregnancy test for tomorrow
  if (lower.includes('book') && lower.includes('pregnancy test') && lower.includes('tomorrow')) {
    const date = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const text = bookAppointment(userId, date, 'Pregnancy Test', 'Dr. Aisha');
    return { text, context: `Booked: Pregnancy Test on ${date} with Dr. Aisha` };
  }

  return null; // not an EMR query → let LLM handle
}

/* ===================== component ===================== */

export default function MedicalChatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm Dr. AI. How can I assist you with your medical concerns today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // keep last structured medical info for follow-up questions like "is it normal?"
  const [lastContext, setLastContext] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1) Try EMR/local data first
      const emr = await handleUserQuery(userMsg.text);

      if (emr) {
        if (emr.context) setLastContext(emr.context);
        setMessages(prev => [...prev, { sender: 'bot', text: emr.text }]);
      } else {
        // 2) Build context-aware prompt for LLM
        const isFollowUpNormal = userMsg.text.toLowerCase().includes('normal');
        const contextBlock = isFollowUpNormal && lastContext
          ? `Patient previously received this data: ${lastContext}`
          : '';

        const retrievedAdvice = await retrieveRelevantAdvice(userMsg.text);

        const prompt = `You are a professional medical assistant. Provide clear, concise, and non-alarming guidance.
${contextBlock ? contextBlock + '\n' : ''}

Patient Input: "${userMsg.text}"
Relevant Medical Information (from local RAG): "${retrievedAdvice}"

Instructions:
- If the question is "is it normal?", use the provided context if available.
- Give practical next steps, red flags to watch for, and when to seek in-person care.
- Keep it friendly and brief.`;

        const botText = await getLLMResponse(prompt);
        setMessages(prev => [...prev, { sender: 'bot', text: botText }]);

        // if LLM produced a direct interpretation of vitals/bp, store as context
        if (!lastContext && (userMsg.text.toLowerCase().includes('vitals') || userMsg.text.toLowerCase().includes('blood pressure'))) {
          setLastContext(retrievedAdvice || '');
        }
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: "I'm sorry, I encountered an error processing your request. Please try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatContainer style={{ marginTop: '60px' }}>
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
            <SpinningIcon />
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
          placeholder="Describe your symptoms or ask about your records (e.g., 'What is my blood pressure?')"
          disabled={loading}
        />
        <SendButton onClick={sendMessage} disabled={loading || !input.trim()}>
          <FaPaperPlane size={18} />
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
}
