export type EducationItem = {
  degree: string;
  institution: string;
  start?: string;
  end?: string;
  completed?: string;
  range?: string;
  type?: "degree" | "study" | "research";
};

export type ExperienceHighlight = string;

export type ExperienceItem = {
  role: string;
  company: string;
  start: string;
  end: string;
  highlights: ExperienceHighlight[];
};

export type Promotion = {
  company: string;
  currentRole: string;
  newRole: string;
  effective: string;
  status: "upcoming";
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type LanguageSkill = {
  language: string;
  level: string;
};

export const profile = {
  name: "Tomás Travis Alonso Cremnitz",
  contact: {
    email: "tomasnataliaalbanes@gmail.com",
  },
  headline: ["Data Engineering", "AI", "Software Engineering"],
  education: [
    {
      degree: "Master's in Data Analytics",
      institution: "Universidad Loyola",
      start: "2023",
      completed: "June 2024",
      type: "degree",
    },
    {
      degree: "Degree in Mathematics",
      institution: "Universidad de Sevilla",
      range: "2018–2023",
      type: "degree",
    },
    {
      degree: "Erasmus",
      institution: "Universidade de Lisboa",
      range: "2020–2021",
      type: "study",
    },
  ],
  experience: [
    {
      role: "Junior Engineer",
      company: "NTT DATA",
      start: "October 2024",
      end: "Present",
      highlights: [
        "Energy trading platforms based on microservice architectures",
        "ETLs and REST API integrations",
        "Prediction and reporting in Cloudera data environments",
        "Technical estimation across frontend, backend and AWS orchestration",
        "Coordination with clients and technical teams",
        "AMS initiative leadership and mentoring of junior profiles",
      ],
    },
    {
      role: "Data Analyst Intern",
      company: "NTT DATA",
      start: "February 2024",
      end: "August 2024",
      highlights: [
        "Maintenance of machine-learning applications and microservices",
        "Anomaly detection and variable prediction",
        "Kubernetes and virtual-machine deployment validation",
      ],
    },
    {
      role: "Deep Learning Research Assistant",
      company: "Universidad Loyola",
      start: "December 2024",
      end: "December 2025",
      highlights: [
        "Reinforcement-learning models integrated with ROS 2",
        "Autonomous control of autonomous surface-vehicle fleets",
      ],
    },
  ],
  promotion: {
    company: "NTT DATA",
    currentRole: "Junior Engineer",
    newRole: "Engineer",
    effective: "September 2026",
    status: "upcoming",
  },
  skills: [
    { category: "Programming", items: ["Python", "PySpark", "R", "SQL", "Haskell", "TypeScript"] },
    { category: "Cloud / DevOps", items: ["AWS", "Docker", "Kubernetes", "CI/CD"] },
    { category: "Machine Learning", items: ["Scikit-learn", "TensorFlow", "Keras"] },
    { category: "Frontend", items: ["Angular", "HTML", "CSS"] },
    { category: "Analytics", items: ["Power BI", "Tableau", "Streamlit"] },
  ],
  certification: ["AWS CLF-002"],
  languages: [
    { language: "Spanish", level: "Native" },
    { language: "English", level: "Native" },
    { language: "French", level: "B1" },
    { language: "Portuguese", level: "A1" },
  ],
} as const;

export type Profile = typeof profile;
