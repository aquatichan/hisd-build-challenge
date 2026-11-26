// Single source of truth for event-level facts and launch flags.
// status: 'confirmed' | 'tba'. Sections hide or soften themselves from these values.

export const event = {
  name: 'Houston ISD Build Challenge',
  coordinates: '29.7604° N, 95.3698° W',

  // Primary call to action. Flip `phase` to 'register' once registration opens.
  // The pilot campus: the school that came up with the Build Challenge. Listed first wherever schools appear.
  pilot: { school: 'Westside High School', url: 'https://whs-build-2627.web.app/' },

  phase: 'updates', // 'updates' | 'register'
  links: {
    updates: '', // Google Form URL (user to provide)
    register: '', // Registration URL (not yet available)
    bringSchool: '', // "Bring your school" form (user to provide)
    contactEmail: '', // user to provide
  },

  // ISO dates when confirmed (e.g. '2026-01-12'); null renders "DATE TBA".
  timeline: [
    { id: 'kickoff', label: 'Kickoff', date: null, status: 'tba' },
    { id: 'build', label: 'Build', date: null, status: 'tba' },
    { id: 'submit', label: 'Submit', date: null, status: 'tba' },
    { id: 'showcase', label: 'Showcase', date: null, status: 'tba' },
  ],

  sections: {
    stories: { visible: true },
    dates: { visible: true },
    projects: { visible: true },
    schools: { visible: true },
    judging: { visible: true, status: 'tba' },
    prizes: { visible: true, status: 'tba' },
    people: { visible: true },
  },
}

export function primaryCta() {
  const registering = event.phase === 'register'
  return {
    label: registering ? 'Register' : 'Get updates',
    href: registering ? event.links.register : event.links.updates,
  }
}
