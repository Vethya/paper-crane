// Mock response for agent edit — used when NEXT_PUBLIC_AGENT_MOCK=true
// Edit this fixture to test different UI states without spending API tokens.

export const MOCK_EDIT_RESPONSE = {
  summary:
    'Tailored 4 fields, added a payments project, and flagged an unrelated entry for removal for a Senior Software Engineer role at Stripe.',
  edits: [
    {
      type: 'set' as const,
      fieldPath: 'work.0.position',
      newValue: 'Senior Software Engineer',
      reason: 'Aligns the title with the seniority level Stripe is hiring for.'
    },
    {
      type: 'set' as const,
      fieldPath: 'work.0.highlights.0',
      newValue:
        'Built full-stack payment systems processing 50k+ transactions/day using React and Node.js, reducing checkout latency by 35%.',
      reason:
        "Positions the first highlight around payments infrastructure — core to Stripe's engineering mission."
    },
    {
      type: 'set' as const,
      fieldPath: 'skills.0.keywords',
      newValue: [
        'TypeScript',
        'React',
        'Node.js',
        'PostgreSQL',
        'REST APIs',
        'GraphQL',
        'Docker'
      ],
      reason:
        'Adds TypeScript and payments-relevant stack keywords from the Stripe JD.'
    },
    {
      type: 'append' as const,
      arrayPath: 'projects' as const,
      entry: {
        name: 'Payment Flow Dashboard',
        description:
          'Built a real-time transaction monitoring dashboard processing 50k+ events/min using React, Node.js, and WebSockets. Reduced fraud detection latency by 40%.',
        keywords: [
          'React',
          'Node.js',
          'WebSockets',
          'TypeScript',
          'PostgreSQL'
        ],
        url: 'github.com/yourhandle/payment-dashboard'
      },
      reason:
        'A payments-domain project directly demonstrates the infrastructure experience Stripe values.'
    },
    {
      type: 'remove' as const,
      arrayPath: 'projects' as const,
      index: 0,
      reason:
        'This unrelated project dilutes the payments focus; removing it keeps the narrative tight for Stripe.'
    }
  ]
}
