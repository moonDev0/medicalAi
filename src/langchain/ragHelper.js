// ragHelper.js
import { medicalKnowledgeBase } from "../utils/medicalData";

export function retrieveRelevantAdvice(userInput) {
  const inputLower = userInput.toLowerCase();
  for (const entry of medicalKnowledgeBase) {
    const match = entry.keywords.some(keyword => inputLower.includes(keyword));
    if (match) return entry.advice;
  }
  return "No specific advice found in local data.";
}
