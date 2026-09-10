import {
  Briefcase, Users, Target, MessageSquare, LayoutGrid,
  Hash, Flame, Newspaper, AlignLeft, Send, Smile, Feather,
} from "lucide-react";
import type { OnboardingAnswers } from "@shared/api";
import type { CheckboxOption } from "./CheckboxCard";

export const defaultAnswers: OnboardingAnswers = {
  industries: [],
  targetAudience: '',
  contentGoal: '',
  tone: '',
  contentFormats: [],
  postingFrequency: '',
  topicsOfInterest: [],
  opinionStyle: '',
  trendingNews: '',
  postLength: '',
  ctaUsage: '',
  emojiUsage: '',
  styleReference: '',
};

// =============================================
// Industry Options (Q1)
// =============================================
export const industryOptions: CheckboxOption[] = [
  { id: 'Web Development', label: 'Web Development', description: 'React, Next.js, Vue, Node, Fullstack' },
  { id: 'AI/ML', label: 'AI & Machine Learning', description: 'LLMs, Prompt Eng, Agents, PyTorch' },
  { id: 'DevOps', label: 'DevOps & SRE', description: 'Docker, Kubernetes, CI/CD, Terraform' },
  { id: 'Mobile Development', label: 'Mobile Development', description: 'React Native, Flutter, iOS, Android' },
  { id: 'Cloud/Infra', label: 'Cloud & Infrastructure', description: 'AWS, GCP, Serverless, Edge, Architecture' },
  { id: 'Cybersecurity', label: 'Cybersecurity', description: 'AppSec, OAuth, Zero Trust, DevSecOps' },
  { id: 'Data Science', label: 'Data Science & Analytics', description: 'Python, SQL, ML pipelines, Data Viz' },
  { id: 'Product/Design', label: 'Product & UX Design', description: 'UI/UX, Product Strategy, Design Systems' },
  { id: 'Startups/Founders', label: 'Startups & Founders', description: 'MVP, Tech Stack, Bootstrapping, Scaling' },
];

// =============================================
// Dynamic Topics Mapping (Q7)
// =============================================
export const industryTopicsMap: Record<string, CheckboxOption[]> = {
  'Web Development': [
    { id: 'React', label: 'React & React Server Components' },
    { id: 'Next.js', label: 'Next.js App Router & DX' },
    { id: 'Vue/Nuxt', label: 'Vue.js & Nuxt' },
    { id: 'TypeScript', label: 'TypeScript & Type Safety' },
    { id: 'Node.js', label: 'Node.js & Backend JS' },
    { id: 'Web Performance', label: 'Core Web Vitals & Performance' },
    { id: 'Tailwind CSS', label: 'Tailwind & Modern Styling' },
    { id: 'Web Architecture', label: 'Frontend System Design' },
  ],
  'AI/ML': [
    { id: 'LLMs', label: 'Large Language Models (LLMs)' },
    { id: 'Prompt Engineering', label: 'Prompt Engineering & System Prompts' },
    { id: 'RAG', label: 'RAG & Vector Databases' },
    { id: 'AI Agents', label: 'Autonomous AI Agents' },
    { id: 'PyTorch/TensorFlow', label: 'Model Fine-Tuning & Frameworks' },
    { id: 'AI Ethics', label: 'AI Safety & Open Source Models' },
  ],
  'DevOps': [
    { id: 'Docker & Containers', label: 'Docker & Containerization' },
    { id: 'Kubernetes', label: 'Kubernetes Orchestration' },
    { id: 'CI/CD Pipelines', label: 'CI/CD Automation & GitHub Actions' },
    { id: 'Terraform & IaC', label: 'Infrastructure as Code' },
    { id: 'Observability', label: 'Logging, Tracing & Monitoring' },
  ],
  'Mobile Development': [
    { id: 'React Native', label: 'React Native & Expo' },
    { id: 'Flutter', label: 'Flutter & Dart' },
    { id: 'iOS Swift', label: 'Swift & SwiftUI' },
    { id: 'Android Kotlin', label: 'Kotlin & Jetpack Compose' },
    { id: 'Mobile Performance', label: 'Mobile UX & Native Modules' },
  ],
  'Cloud/Infra': [
    { id: 'AWS Services', label: 'AWS Cloud Architecture' },
    { id: 'Serverless', label: 'Serverless Functions & Lambdas' },
    { id: 'Edge Computing', label: 'Edge Computing & CDNs' },
    { id: 'Database Tuning', label: 'Postgres & Distributed Databases' },
    { id: 'Microservices', label: 'Microservices vs Monoliths' },
  ],
  'Cybersecurity': [
    { id: 'Application Security', label: 'AppSec & Vulnerability Management' },
    { id: 'Identity & Auth', label: 'OAuth2, OIDC & JWT Auth' },
    { id: 'Zero Trust', label: 'Zero Trust Security Models' },
    { id: 'DevSecOps', label: 'DevSecOps & Supply Chain Security' },
  ],
  'Data Science': [
    { id: 'Python Data Stack', label: 'Pandas, NumPy & Polars' },
    { id: 'SQL & Data Warehouse', label: 'SQL Optimization & Snowflake/BigQuery' },
    { id: 'Data Pipelines', label: 'dbt, Airflow & Data Engineering' },
    { id: 'Data Visualization', label: 'Executive Dashboarding & Viz' },
  ],
  'Product/Design': [
    { id: 'Design Systems', label: 'Design Systems & Component Libraries' },
    { id: 'UX Research', label: 'User Research & Usability Testing' },
    { id: 'Product Strategy', label: 'Roadmapping & Feature Prioritization' },
    { id: 'Micro-interactions', label: 'UI Animation & Micro-interactions' },
  ],
  'Startups/Founders': [
    { id: 'MVP Development', label: 'Building & Launching MVPs Fast' },
    { id: 'Tech Stack Choice', label: 'Choosing Tech Stack for Speed' },
    { id: 'Hiring Engineers', label: 'Hiring & Engineering Leadership' },
    { id: 'Bootstrapping', label: 'Bootstrapping vs VC Funding' },
  ],
};

export const defaultFallbackTopics: CheckboxOption[] = [
  { id: 'Software Architecture', label: 'Software Architecture & System Design' },
  { id: 'Clean Code', label: 'Clean Code & Refactoring' },
  { id: 'Developer Productivity', label: 'Developer Tools & DX' },
  { id: 'Career Growth', label: 'Senior Engineer Career Advice' },
  { id: 'Open Source', label: 'Open Source Maintenance & Community' },
];

// =============================================
// Questions Config (12 Steps + Summary)
// postingFrequency comes from subscription, not onboarding
// =============================================
export const questionsConfig = [
  { id: 'industries', label: 'Industry', icon: Briefcase },
  { id: 'targetAudience', label: 'Audience', icon: Users },
  { id: 'contentGoal', label: 'Goal', icon: Target },
  { id: 'tone', label: 'Tone', icon: MessageSquare },
  { id: 'contentFormats', label: 'Format', icon: LayoutGrid },
  { id: 'topicsOfInterest', label: 'Topics', icon: Hash },
  { id: 'opinionStyle', label: 'Stance', icon: Flame },
  { id: 'trendingNews', label: 'News', icon: Newspaper },
  { id: 'postLength', label: 'Length', icon: AlignLeft },
  { id: 'ctaUsage', label: 'CTA', icon: Send },
  { id: 'emojiUsage', label: 'Emoji', icon: Smile },
  { id: 'styleReference', label: 'Style Ref', icon: Feather },
];

/** Question cards before the summary review step */
export const QUESTION_COUNT = questionsConfig.length;

