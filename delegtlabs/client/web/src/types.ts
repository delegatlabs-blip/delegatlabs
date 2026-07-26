export type ViewMode = 'product' | 'checkout' | 'browse' | 'solutions' | 'enterprise' | 'pricing';

export interface Agent {
  id: string;
  name: string;
  version: string;
  subtitle: string;
  description: string;
  monthlyPrice: number;
  oneTimePrice: number;
  category: string;
  latency: string;
  compliance: string;
  contextWindow: string;
  accuracy: string;
  firstTokenTime: string;
  imageUrl: string;
  specs: {
    neuralEngine: string;
    security: string[];
  };
  useCases: {
    title: string;
    description: string;
    icon: string;
  }[];
  activeInstances: string;
  uptime: string;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  company: string;
  avatarUrl: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface CheckoutFormState {
  fullName: string;
  workEmail: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  billingCycle: 'subscription' | 'onetime';
}

export interface OrderSummaryData {
  agent: Agent;
  billingCycle: 'subscription' | 'onetime';
  subtotal: number;
  computeOverhead: number;
  priorityQueueingFee: number;
  total: number;
}
