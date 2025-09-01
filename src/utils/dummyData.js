// utils/dummyData.js
export const users = [
    {
      id: 1,
      name: "John Doe",
      genotype: "AA",
      bloodPressure: "120/80 mmHg",
      vitals: {
        heartRate: 72,
        temperature: "36.8°C",
        weight: "70kg",
      },
      appointments: [
        { date: "2025-09-02", type: "Checkup", doctor: "Dr. Musa" },
      ],
    },
  ];
  
  export const doctors = [
    { name: "Dr. Musa", specialty: "General Physician", available: ["2025-09-01", "2025-09-02"] },
    { name: "Dr. Aisha", specialty: "Gynecologist", available: ["2025-09-02"] },
  ];
  