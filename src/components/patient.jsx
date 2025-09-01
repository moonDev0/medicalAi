import React, { useState, useRef, useEffect } from 'react';
import { getLLMResponse } from '../langchain/openrouterService';
import { retrieveRelevantAdvice } from '../langchain/ragHelper';
import { FaPaperPlane, FaUserMd, FaUser, FaSpinner, FaHeartbeat, FaChartLine, FaPills, FaCalendarAlt, FaFileMedical, FaProcedures, FaVial } from 'react-icons/fa';
import styled, { keyframes, css } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const riseUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(100, 149, 237, 0.5); }
  50% { box-shadow: 0 0 20px rgba(100, 149, 237, 0.8); }
  100% { box-shadow: 0 0 5px rgba(100, 149, 237, 0.5); }
`;

// Styled Components
const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: 80px 1fr;
  height: 100vh;
  background: #0a0e17;
  color: white;
  font-family: 'Segoe UI', sans-serif;
`;

const Header = styled.header`
  grid-column: 1 / -1;
  background: rgba(16, 24, 39, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
`;

const Sidebar = styled.aside`
  background: rgba(16, 24, 39, 0.7);
  padding: 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
`;

const MainContent = styled.main`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto auto 1fr;
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
`;

const Card = styled.div`
  background: rgba(16, 24, 39, 0.6);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  animation: ${riseUp} 0.5s ease-out forwards;
  animation-delay: ${props => props.delay || '0s'};
  opacity: 0;
  
  &:hover {
    transform: translateY(-5px);
    border-color: rgba(100, 149, 237, 0.5);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const PatientProfileCard = styled(Card)`
  grid-column: 1 / 5;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
  }
`;

const HealthStatsCard = styled(Card)`
  grid-column: 5 / 9;
  grid-row: 1;
`;

const MedicationsCard = styled(Card)`
  grid-column: 9 / 13;
  grid-row: 1;
`;

const VitalsCard = styled(Card)`
  grid-column: 1 / 7;
  grid-row: 2;
`;

const AppointmentsCard = styled(Card)`
  grid-column: 7 / 13;
  grid-row: 2;
`;

const ChatCard = styled(Card)`
  grid-column: 1 / 9;
  grid-row: 3;
`;

const RecordsCard = styled(Card)`
  grid-column: 9 / 13;
  grid-row: 3;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-size: 40px;
  color: white;
  border: 3px solid rgba(255, 255, 255, 0.2);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(79, 70, 229, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #4f46e5;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.7;
  margin-top: 3px;
`;

const VitalChart = styled.div`
  height: 200px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 15px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.3), transparent);
    z-index: 1;
  }
`;

const ChartLine = styled.div`
  position: absolute;
  height: 2px;
  background: #4f46e5;
  bottom: ${props => props.value}%;
  left: 0;
  right: 0;
  z-index: 2;
  
  &::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4f46e5;
    top: -4px;
    left: ${props => props.position}%;
  }
`;

const MedicationItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(79, 70, 229, 0.2);
    transform: translateX(5px);
  }
`;

const MedicationIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(6, 182, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #06b6d4;
`;

const AppointmentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(236, 72, 153, 0.2);
    transform: translateX(5px);
  }
`;

const AppointmentIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(236, 72, 153, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #ec4899;
`;

const RecordItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(245, 158, 11, 0.2);
    transform: translateX(5px);
  }
`;

const RecordIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #f59e0b;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatHeader = styled.div`
  background: rgba(16, 24, 39, 0.8);
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 10px 10px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background: rgba(16, 24, 39, 0.4);
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
  
  ${props => props.sender === 'bot' ? css`
    align-self: flex-start;
    background: rgba(16, 24, 39, 0.8);
    border-top-left-radius: 4px;
    color: white;
    border: 1px solid rgba(79, 70, 229, 0.3);
  ` : css`
    align-self: flex-end;
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
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
  
  ${props => props.sender === 'bot' ? css`
    background: #4f46e5;
    color: white;
  ` : css`
    background: white;
    color: #4f46e5;
    border: 1px solid #4f46e5;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  padding: 15px;
  background: rgba(16, 24, 39, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 10px 10px;
`;

const InputField = styled.input`
  flex: 1;
  padding: 12px 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  outline: none;
  font-size: 16px;
  background: rgba(16, 24, 39, 0.6);
  color: white;
  transition: all 0.3s;
  
  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SendButton = styled.button`
  margin-left: 10px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: scale(1.05);
    animation: ${glow} 1.5s infinite;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    animation: none;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-top: 10px;
  animation: ${pulse} 1.5s infinite;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(90deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.3s;
  
  ${props => props.active ? css`
    background: rgba(79, 70, 229, 0.2);
    color: #4f46e5;
    font-weight: 600;
  ` : css`
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
  `}
`;

const NavIcon = styled.div`
  margin-right: 10px;
  font-size: 18px;
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
`;

const CardTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  display: flex;
  align-items: center;
  color: white;
  
  svg {
    margin-right: 10px;
    color: #4f46e5;
  }
`;

const TimeBadge = styled.span`
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  margin-left: auto;
`;

const StatusBadge = styled.span`
  background: ${props => props.urgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};
  color: ${props => props.urgent ? '#ef4444' : '#10b981'};
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  margin-left: 10px;
`;

// Component
export default function PatientDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hello! I'm Dr. AI. How can I assist you with your health today?" }
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

  // Mock data
  const patientData = {
    name: "Alex Johnson",
    age: 34,
    gender: "Male",
    bloodType: "O+",
    lastVisit: "2023-05-15",
    nextAppointment: "2023-06-20"
  };

  const healthStats = [
    { icon: <FaHeartbeat />, label: "Heart Rate", value: "72 bpm", status: "normal" },
    { icon: <FaChartLine />, label: "Blood Pressure", value: "120/80 mmHg", status: "normal" },
    { icon: <FaVial />, label: "Glucose Level", value: "98 mg/dL", status: "normal" },
    { icon: <FaProcedures />, label: "BMI", value: "24.3", status: "healthy" }
  ];

  const medications = [
    { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily", for: "Cholesterol" },
    { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", for: "Blood pressure" },
    { name: "Metformin", dosage: "500mg", frequency: "Twice daily", for: "Blood sugar" }
  ];

  const vitalsData = [
    { day: "Mon", value: 65 },
    { day: "Tue", value: 68 },
    { day: "Wed", value: 72 },
    { day: "Thu", value: 70 },
    { day: "Fri", value: 75 },
    { day: "Sat", value: 74 },
    { day: "Sun", value: 71 }
  ];

  const appointments = [
    { doctor: "Dr. Sarah Miller", specialty: "Cardiology", date: "June 20, 2023", time: "10:30 AM", urgent: false },
    { doctor: "Dr. James Wilson", specialty: "Dermatology", date: "July 5, 2023", time: "2:15 PM", urgent: true },
    { doctor: "Dr. Lisa Chen", specialty: "Endocrinology", date: "August 12, 2023", time: "9:00 AM", urgent: false }
  ];

  const medicalRecords = [
    { title: "Blood Test Results", date: "May 10, 2023", type: "Lab Results" },
    { title: "Cardiology Consultation", date: "April 22, 2023", type: "Consultation Notes" },
    { title: "X-Ray - Chest", date: "March 15, 2023", type: "Imaging" },
    { title: "Annual Physical Exam", date: "January 5, 2023", type: "Exam Report" }
  ];

  return (
    <DashboardContainer>
      <Header>
        <Logo>MediFutura</Logo>
        <UserMenu>
          <span>Dr. Smith</span>
          <UserAvatar>DS</UserAvatar>
        </UserMenu>
      </Header>
      
      <Sidebar>
        <NavItem active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')}>
          <NavIcon>📊</NavIcon>
          Dashboard
        </NavItem>
        <NavItem active={activeNav === 'patients'} onClick={() => setActiveNav('patients')}>
          <NavIcon>👥</NavIcon>
          Patients
        </NavItem>
        <NavItem active={activeNav === 'appointments'} onClick={() => setActiveNav('appointments')}>
          <NavIcon>📅</NavIcon>
          Appointments
        </NavItem>
        <NavItem active={activeNav === 'medications'} onClick={() => setActiveNav('medications')}>
          <NavIcon>💊</NavIcon>
          Medications
        </NavItem>
        <NavItem active={activeNav === 'reports'} onClick={() => setActiveNav('reports')}>
          <NavIcon>📋</NavIcon>
          Reports
        </NavItem>
        <NavItem active={activeNav === 'settings'} onClick={() => setActiveNav('settings')}>
          <NavIcon>⚙️</NavIcon>
          Settings
        </NavItem>
      </Sidebar>
      
      <MainContent>
        <PatientProfileCard delay="0.1s">
          <Avatar>{patientData.name.charAt(0)}</Avatar>
          <h3>{patientData.name}</h3>
          <p>{patientData.age} years • {patientData.gender} • {patientData.bloodType}</p>
          <div style={{ width: '100%', marginTop: '20px' }}>
            <StatItem>
              <StatIcon><FaCalendarAlt /></StatIcon>
              <div>
                <StatLabel>Last Visit</StatLabel>
                <StatValue>{patientData.lastVisit}</StatValue>
              </div>
            </StatItem>
            <StatItem>
              <StatIcon><FaCalendarAlt /></StatIcon>
              <div>
                <StatLabel>Next Appointment</StatLabel>
                <StatValue>{patientData.nextAppointment}</StatValue>
              </div>
            </StatItem>
          </div>
        </PatientProfileCard>
        
        <HealthStatsCard delay="0.2s">
          <CardTitle><FaHeartbeat /> Health Stats</CardTitle>
          {healthStats.map((stat, index) => (
            <StatItem key={index}>
              <StatIcon>{stat.icon}</StatIcon>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <StatValue>{stat.value}</StatValue>
                  <StatusBadge urgent={stat.status !== 'normal' && stat.status !== 'healthy'}>
                    {stat.status}
                  </StatusBadge>
                </div>
                <StatLabel>{stat.label}</StatLabel>
              </div>
            </StatItem>
          ))}
        </HealthStatsCard>
        
        <MedicationsCard delay="0.3s">
          <CardTitle><FaPills /> Medications</CardTitle>
          {medications.map((med, index) => (
            <MedicationItem key={index}>
              <MedicationIcon><FaPills size={14} /></MedicationIcon>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{med.name} <span style={{ opacity: 0.7 }}>{med.dosage}</span></div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{med.frequency} • For {med.for}</div>
              </div>
            </MedicationItem>
          ))}
        </MedicationsCard>
        
        <VitalsCard delay="0.4s">
          <CardTitle><FaChartLine /> Heart Rate Trend</CardTitle>
          <p style={{ marginTop: '-10px', marginBottom: '10px', opacity: 0.7, fontSize: '14px' }}>Last 7 days</p>
          <VitalChart>
            {vitalsData.map((vital, index) => (
              <ChartLine 
                key={index} 
                value={100 - vital.value} 
                position={(index / (vitalsData.length - 1)) * 100}
              />
            ))}
          </VitalChart>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            {vitalsData.map((vital, index) => (
              <div key={index} style={{ textAlign: 'center', fontSize: '12px', opacity: 0.7 }}>
                {vital.day}<br />
                <span style={{ fontWeight: '600' }}>{vital.value}</span>
              </div>
            ))}
          </div>
        </VitalsCard>
        
        <AppointmentsCard delay="0.5s">
          <CardTitle><FaCalendarAlt /> Upcoming Appointments</CardTitle>
          {appointments.map((appt, index) => (
            <AppointmentItem key={index}>
              <AppointmentIcon><FaUserMd size={16} /></AppointmentIcon>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{appt.doctor}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{appt.specialty}</div>
              </div>
              <TimeBadge>{appt.time}</TimeBadge>
              {appt.urgent && <StatusBadge urgent>Urgent</StatusBadge>}
            </AppointmentItem>
          ))}
        </AppointmentsCard>
        
        <ChatCard delay="0.6s">
          <ChatContainer>
            <ChatHeader>
              <div>
                <FaUserMd size={16} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}> I am your medical AI Assistant</h3>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.8em' }}>
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
        </ChatCard>
        
        <RecordsCard delay="0.7s">
          <CardTitle><FaFileMedical /> Medical Records</CardTitle>
          {medicalRecords.map((record, index) => (
            <RecordItem key={index}>
              <RecordIcon><FaFileMedical size={16} /></RecordIcon>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{record.title}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{record.type} • {record.date}</div>
              </div>
            </RecordItem>
          ))}
        </RecordsCard>
      </MainContent>
    </DashboardContainer>
  );
}