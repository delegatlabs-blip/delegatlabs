import { Agent, Review } from '../types';

export const TRUST_BADGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQnAOem3uEvSJzd_agxvVoNCkJOVeKoUoStAluK3BUX--RrcGgX8wDHeSMAzfUM190cIx9iTKrp4lR8IdEOFQo-UHJUkp_F3UYibMawZX3tG97_FT1rcK2L4qhDOsXbIP45yjrgNGLA7T9CEIWx9mXtHYSWTjFkqLscgTh1nAhkL68qZEnGR-46OSyu8v6dyFG3l9AO6nzdM-ZDeczbvaDjZBKxBTILMaExHvgpP4N9UcwKif_kDJftgNY7-3vaX-O4GI9TJ_Q9AZ2',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC8yKHEGH2IW7ajJCqCvBOV4dARuHs7EtPCvUugHT3fyIAyATNTQ6PaMDOWZ-OYiT1kTDPETp1B-uyn48fzyyffAI8In5NKZ4fDk_-eKJQQYZQb_N-TISnkGVyU0HKsHyJ0WLDSM3gq8AUE9TgAbwkjQD2k1fEgjidQIUyQ0atkZl5icAtLW6txyNmiTq9WmY2Lowkic1iLz7qHlq1a49tfyY_6DMsBHVvy7E0mbIBLOf6EhCFFaAbS51GVeBNQ3qwIC7OEXkYW9l2k',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAgP0ogJwMsHVmNlcx_pPB3VzHTIzhwWUwGSGlFyyMWSPUTq1MahsuTI8Qq3kmnxlr1bBDolsKouBnRmmvpp1REl7Os3PMNT5fOBm5q62gVnxMipvK1aSo16Egl-VP6LxL88CMvxgy7Yzi_1wNyD55BHRcuU-W4rALQFGlUNfCdgo8mqQkqQQ0SJp1q6JQyFGSpdGYPT5fl8rSGfn7l8756H6iKygU6zvyEIc2rFUV26jfPq_g_nAW7B3dyolVglKQyWRG4DL9k0vDC'
];

export const AVATARS = {
  exec: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjeOlEPoCQvVXCzknYLYWhU1IciYbT3fVarzstok8m6eYzky8Eeml90uD1qD-cLwuh2lSrebJ1aakTXnmuIdfiO9_AyaWBqwPSmK9fFpeXKduQ8qm2wfb3HZ-u13aXs5GnVYWTO_1JYMwhTixsPpKbrjc8olduD50BV02xVd8ntqX5WHuMLVu1Z_zox6ek27D_Xzn043yUeG2PGWXUWyWqUyoasin9BUxNQlve3mCf1KUwLu6Yn86H4ag9dXqAr0WsTyNRug8tQXIP',
  architect: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUL1U9GmA662Igh323nTt36qTWxZxxpBD_oHH8EH0H8jHhtcjr9P8HCssJ6myuIm535K1RoDPBsrKmw6dyIPw3o9T3nm6rb_SKTT5DuBvmRmOsqivyv2lIXZHt2yKqs3jJvKCxg9oXjVE12F_5hZaU8zq8sHUZfFRN2LKKWpzyGfXjD9u_DihRI2xdHjLvC_bullb2P0To-YBRnQGGuBk6yHzFlCX7oHCCdpsXNLdh8i0zjg_zxd9RpcJvz1y_-kMzgGvYwR6-Ei5q',
  manager: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDr9TUnQojoni8ihcLJhWUxf_jVRgfJ5S0oiLJGrmY5WdJCvkABQ-JPS_8Q9vBaQm8po8Pf-IAFrS8-esyS_vEk9_YlULDtlUtPf0bWIk98AZ7jXOsFuNtT26nPPxlWiYpL8eXYxO4-RGR9XGwVqqG1DM22ZMCh-bqggYI5ehp-b8Iqlf5rHqG5MHIs4RgiBSPpEYX3ZHA1mRRUcA7aMfM-00AHNk1R0pMymm2iS7ZCTHD-w8MLt6HvM74lFy1hxkfVYlLPkN2Z_p6',
  sarah: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUwJRSSaEgRO9lDZ5o3WWAEmLe6isgz0IY1JDqBpQO0GnEHJiV5lURGZnbL9xN12VM4hB4CBXtgK_eutCc99g4Sxu6e3fLofSCrZM1BikHgCoOFEBsI1xEWshzs-hvj3PziDsugb_QzRw6rtxullkzKhLl9w53vFXZkQ_ynwfSBx4lsalSC4boTCE6mvXQ2dUfm_BPz-gpx4wpNMXy3ToFMKkKNIpme6KmWUTobndAd8ZeHZ1C822z3ci2ADpL64pIfxuRvbIOKxOB',
  marcus: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjoC57yJKYYyLlnAQ94qywcRJKGWO0fHi-_oTWJnBVAdT8PKWTD0UjTaVKP-7LkVgAFqBr4YTjL01oJ5SmpemhDnsbtgC92OAQ1KDOnrFhCvP4aFn3KCbHhLNfAHKib203vNs07F93apVqJNML_w7RVJsuxcLGzvR7SxQREjP5ifFEBQwpOo_N1x0Y8ridCGdcfPPWKemWgQEyMqbx9sIQaw0sgDoROB_so34a8XyEmkEZuTSs1P2JnCQC1bNCbvdNeK7TDTiored3',
  elena: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs-nO96gGEL0-81XAqA8hISkgLNMosJfbVS3KfrV1P8W0UV5HV-4isHUt3RLviMCZokvyjs06tCdNhKZ3VHYQpsSDQfk1_vLRO0StzBgnFCYQZkdogxG6FuUakDbC4Q9px8No4-bIM_h4ztmB3SKL_EjpNFjOnmyLBMAsoOi0_eMBh98306Ke8fG5x9rDUYdjPY-U-mbfGGYyMJiYBAueDNujfNo3j8UUK2_5_COkwZIiWyZxfTTt4gqYoQ8LEB4gsqbwY27RahhtO'
};

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'sentient-logic-pro',
    name: 'Sentient Logic Pro',
    version: 'Enterprise Agent v4.2',
    subtitle: 'The industry standard for multi-modal reasoning and complex decision-making.',
    description: 'Sentient Logic Pro leverages a proprietary neural architecture to deliver 99.9% accuracy in automated analytical workflows, parallel logic branching, and zero-latency decision pipelines.',
    monthlyPrice: 499,
    oneTimePrice: 14950,
    category: 'NLP & Reasoning',
    latency: '3.2ms Latency',
    compliance: 'SOC2 Compliant',
    contextWindow: '2TB Context Window',
    accuracy: '99.9%',
    firstTokenTime: '<100ms',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5ccGFdn3AhQC-cxybNBFhc_fVSx9XZ6n0-TZijPwJ0Xxbf63fgYZSEK-7XxGc4o7nbchNdQaIcuc_uY17McK5MsniOgKBYTeZLJm_Yy3UVK1O62zVYnEeUuG7rJmdWGwQ34qcgogzBdsLCVL5Ci3L8Qn8zrMzZitbW0VpN-dINWOmf7RsUBBHQWTxXtx0ndRTgY3xSdiJIgA6iRkyZZmUdRUNfphbHA_qAffjb0fCakfnAMZeEnRnavsHOhOLgTWTd5cBkii12PFX',
    specs: {
      neuralEngine: 'Utilizes the proprietary Aether-VII transformer model optimized for parallel logic branching. Support for 128-bit quantization ensures precision without sacrificing inference speed in production environments.',
      security: [
        'AES-256 Encryption',
        'Private VPC Support',
        'Zero Data Retention',
        'On-Prem Deployable'
      ]
    },
    useCases: [
      {
        title: 'Automated Market Intelligence',
        description: 'Scan millions of real-time data points to identify emerging market trends before they hit the mainstream. Sentient Logic Pro creates structured reports and actionable signals automatically.',
        icon: 'analytics'
      },
      {
        title: 'DevOps Automation & Debugging',
        description: 'Integrated into your CI/CD pipeline, the agent autonomously identifies code regressions and suggests high-performance refactors based on global best practices.',
        icon: 'terminal'
      },
      {
        title: 'Complex Supply Chain Orchestration',
        description: 'Manage logistics across multiple jurisdictions, predicting delays and autonomously rerouting resources to maintain peak operational efficiency.',
        icon: 'hub'
      }
    ],
    activeInstances: '12,400+',
    uptime: '99.99%',
    rating: 4.8,
    reviewCount: 428
  },
  {
    id: 'sentinel-x-agent',
    name: 'Sentinel-X Agent',
    version: 'Automation Tier v2.1',
    subtitle: 'High-speed NLP parsing, structured document extraction, and workflow triggers.',
    description: 'Designed for high-throughput enterprise pipelines requiring sub-second document comprehension, automated semantic tagging, and automated action execution.',
    monthlyPrice: 129,
    oneTimePrice: 3950,
    category: 'NLP & Reasoning',
    latency: '1.8ms Latency',
    compliance: 'HIPAA & SOC2',
    contextWindow: '512GB Context',
    accuracy: '99.4%',
    firstTokenTime: '<45ms',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5ccGFdn3AhQC-cxybNBFhc_fVSx9XZ6n0-TZijPwJ0Xxbf63fgYZSEK-7XxGc4o7nbchNdQaIcuc_uY17McK5MsniOgKBYTeZLJm_Yy3UVK1O62zVYnEeUuG7rJmdWGwQ34qcgogzBdsLCVL5Ci3L8Qn8zrMzZitbW0VpN-dINWOmf7RsUBBHQWTxXtx0ndRTgY3xSdiJIgA6iRkyZZmUdRUNfphbHA_qAffjb0fCakfnAMZeEnRnavsHOhOLgTWTd5cBkii12PFX',
    specs: {
      neuralEngine: 'Powered by Sentinel Transformer-Lite core with sub-50ms inference. Optimized for serverless edge deployment with ultra-compact RAM footprint.',
      security: [
        'End-to-End Encryption',
        'ISO 27001 Certified',
        'Local File Sandbox',
        'Role-Based Controls'
      ]
    },
    useCases: [
      {
        title: 'Enterprise Document Intelligence',
        description: 'Parse invoices, legal briefs, and technical schematics into structured JSON with 99.4% field precision.',
        icon: 'description'
      },
      {
        title: 'Customer Intent & Escalation',
        description: 'Automate tier-1 customer support triage, auto-generating resolution paths before human escalation.',
        icon: 'support_agent'
      },
      {
        title: 'Real-Time Fraud Telemetry',
        description: 'Evaluate transaction streams in under 2ms to block anomalous financial requests.',
        icon: 'shield_lock'
      }
    ],
    activeInstances: '28,900+',
    uptime: '99.99%',
    rating: 4.9,
    reviewCount: 812
  },
  {
    id: 'aegis-vision-core',
    name: 'Aegis Vision Core',
    version: 'Multimodal Engine v3.0',
    subtitle: 'Real-time spatial visual reasoning and video stream defect detection.',
    description: 'Process high-definition multi-camera streams with hardware-accelerated computer vision and automated hazard reporting.',
    monthlyPrice: 289,
    oneTimePrice: 8500,
    category: 'Security',
    latency: '4.5ms Latency',
    compliance: 'GDPR & SOC2',
    contextWindow: '1TB Context',
    accuracy: '99.7%',
    firstTokenTime: '<80ms',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5ccGFdn3AhQC-cxybNBFhc_fVSx9XZ6n0-TZijPwJ0Xxbf63fgYZSEK-7XxGc4o7nbchNdQaIcuc_uY17McK5MsniOgKBYTeZLJm_Yy3UVK1O62zVYnEeUuG7rJmdWGwQ34qcgogzBdsLCVL5Ci3L8Qn8zrMzZitbW0VpN-dINWOmf7RsUBBHQWTxXtx0ndRTgY3xSdiJIgA6iRkyZZmUdRUNfphbHA_qAffjb0fCakfnAMZeEnRnavsHOhOLgTWTd5cBkii12PFX',
    specs: {
      neuralEngine: 'Aegis Spatial Convolutional Tensor Engine supporting 60fps 4K video feeds with zero frame dropping.',
      security: [
        'Biometric Anonymization',
        'Private VPC Tunneling',
        'Hardware TPM Support',
        'Zero Cloud Storage Option'
      ]
    },
    useCases: [
      {
        title: 'Manufacturing Defect Inspection',
        description: 'Scan silicon wafers and assembly lines for sub-millimeter defects in real time.',
        icon: 'visibility'
      },
      {
        title: 'Autonomous Perimeter Security',
        description: 'Detect thermal anomalies, unauthorized intrusions, and safety non-compliance automatically.',
        icon: 'security'
      }
    ],
    activeInstances: '6,100+',
    uptime: '99.98%',
    rating: 4.7,
    reviewCount: 194
  },
  {
    id: 'pulse-analytics-bot',
    name: 'Pulse Analytics Bot',
    version: 'Financial Suite v5.1',
    subtitle: 'Algorithmic market sentiment analysis and predictive revenue modeling.',
    description: 'Synthesizes global financial news, quarterly earnings transcripts, and order book depth into automated trading strategies.',
    monthlyPrice: 199,
    oneTimePrice: 5900,
    category: 'Financial Analytics',
    latency: '2.1ms Latency',
    compliance: 'FINRA Compliant',
    contextWindow: '1.5TB Context',
    accuracy: '99.8%',
    firstTokenTime: '<60ms',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5ccGFdn3AhQC-cxybNBFhc_fVSx9XZ6n0-TZijPwJ0Xxbf63fgYZSEK-7XxGc4o7nbchNdQaIcuc_uY17McK5MsniOgKBYTeZLJm_Yy3UVK1O62zVYnEeUuG7rJmdWGwQ34qcgogzBdsLCVL5Ci3L8Qn8zrMzZitbW0VpN-dINWOmf7RsUBBHQWTxXtx0ndRTgY3xSdiJIgA6iRkyZZmUdRUNfphbHA_qAffjb0fCakfnAMZeEnRnavsHOhOLgTWTd5cBkii12PFX',
    specs: {
      neuralEngine: 'Pulse Quantum Quant transformer built on high-frequency financial time-series architecture.',
      security: [
        'Air-gapped Key Isolation',
        'SOC2 Type II',
        'Custom Audit Logs',
        'Sub-millisecond Latency Bridge'
      ]
    },
    useCases: [
      {
        title: 'Portfolio Risk Optimization',
        description: 'Dynamically rebalance hedge fund positions based on macro market shifts and volatility indices.',
        icon: 'trending_up'
      }
    ],
    activeInstances: '18,200+',
    uptime: '99.99%',
    rating: 4.9,
    reviewCount: 650
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Sarah J.',
    role: 'Head of AI',
    company: 'NexaCorp',
    avatarUrl: AVATARS.sarah,
    rating: 5,
    date: '2 days ago',
    comment: '"Sentient Logic Pro fundamentally changed how we handle financial forecasting. The depth of reasoning is unparalleled in the market today."',
    verified: true
  },
  {
    id: 'rev-2',
    author: 'Marcus Chen',
    role: 'Principal Engineer',
    company: 'DevFlow',
    avatarUrl: AVATARS.marcus,
    rating: 5,
    date: '1 week ago',
    comment: '"The integration was effortless. We had the agent running in our staging environment within 15 minutes of getting the API keys."',
    verified: true
  },
  {
    id: 'rev-3',
    author: 'Elena Rodriguez',
    role: 'Product Lead',
    company: 'Aris Logistics',
    avatarUrl: AVATARS.elena,
    rating: 5,
    date: '2 weeks ago',
    comment: '"We\'ve reduced our operational errors by nearly 85% since deploying the Logic Pro agent to our supply chain logic layer."',
    verified: true
  }
];
