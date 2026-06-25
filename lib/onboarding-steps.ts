// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Conversational intros for each onboarding step. Static templates with
// {name} interpolation — no Anthropic call needed per step since the
// prompts in the spec are fixed strings.

export const TOTAL_STEPS = 6;

export type StepIntro = {
  number: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  agentSays: (name: string) => string;
};

export const STEP_INTROS: StepIntro[] = [
  {
    number: 1,
    title: 'Business Info',
    agentSays: (name) =>
      `Welcome, ${name || 'there'}! Let's get your digital presence set up. First, tell me about your business.`,
  },
  {
    number: 2,
    title: 'Brand & Style',
    agentSays: () =>
      `Now let's capture your brand. This helps us make sure your site looks and feels like YOU.`,
  },
  {
    number: 3,
    title: 'Upload Photos & Videos',
    agentSays: () =>
      `Upload any photos or videos you want on your site. Don't worry about perfection — we'll help you place them.`,
  },
  {
    number: 4,
    title: 'Review & Label Assets',
    agentSays: () =>
      `Here's what you've uploaded. Let's make sure everything is in the right place.`,
  },
  {
    number: 5,
    title: 'Services & Pricing',
    agentSays: () =>
      `Tell me about your services so we can build out your services section.`,
  },
  {
    number: 6,
    title: 'Domain & Keywords',
    agentSays: () =>
      `Almost done! Let's lock in your domain name and make sure you show up in local search.`,
  },
];

export const PAGE_POSITIONS = ['hero', 'about', 'services', 'gallery'] as const;
export type PagePosition = typeof PAGE_POSITIONS[number];

export const FONT_OPTIONS = [
  'Elegant / Serif',
  'Clean / Modern',
  'Bold / Display',
  'Playful',
] as const;
