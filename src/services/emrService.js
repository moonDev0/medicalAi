import { users, doctors } from "../utils/dummyData";

export function getUserByName(name) {
  return users.find(u => u.name.toLowerCase() === name.toLowerCase());
}

export function getUserVitals(userId) {
  const user = users.find(u => u.id === userId);
  return user?.vitals || "No vitals found.";
}

export function getUserGenotype(userId) {
  const user = users.find(u => u.id === userId);
  return user?.genotype || "Genotype not available.";
}

export function getUserBloodPressure(userId) {
  const user = users.find(u => u.id === userId);
  return user?.bloodPressure || "Blood pressure not available.";
}

export function getDoctorAvailability(date) {
  return doctors.filter(doc => doc.available.includes(date));
}

export function bookAppointment(userId, date, type, doctorName) {
  const user = users.find(u => u.id === userId);
  if (!user) return "User not found.";
  
  const doctor = doctors.find(d => d.name === doctorName && d.available.includes(date));
  if (!doctor) return "Doctor not available on that date.";

  user.appointments.push({ date, type, doctor: doctor.name });
  return `Appointment booked with ${doctor.name} on ${date} for ${type}.`;
}
