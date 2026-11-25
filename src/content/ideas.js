// EXAMPLE ideas to spark thinking. These are not real submissions and not real student projects.
// When submissions exist, add entries with kind: 'submission' (plus school + team + photo) and they render with a different badge.
// impact: up to three { icon, label } chips under the description.
// mockup: path to a mockup image shown above the description (e.g. '/mockups/campus-garden.png'); '' shows a placeholder.
export const ideas = [
  {
    kind: 'example',
    mockup: '',
    icon: 'leaf',
    title: 'Campus Garden System',
    summary: 'A smart garden that uses sensors to monitor plant health and soil moisture, and waters only when needed to save water on campus.',
    impact: [
      { icon: 'leaf', label: 'Sustainability' },
      { icon: 'gear', label: 'Technology' },
      { icon: 'users', label: 'Campus impact' },
    ],
    builtWith: 'Microcontroller, soil sensors, small pump',
  },
  {
    kind: 'example',
    mockup: '',
    icon: 'calendar',
    title: 'Lunch Line Live',
    summary: 'A live estimate of cafeteria wait times, so students can pick the shortest line and get more of their lunch period back.',
    impact: [
      { icon: 'chart', label: 'Data' },
      { icon: 'gear', label: 'Technology' },
      { icon: 'users', label: 'Campus impact' },
    ],
    builtWith: 'Web app, simple sensors or staff check-ins',
  },
  {
    kind: 'example',
    mockup: '',
    icon: 'pin',
    title: 'Campus Wayfinder',
    summary: 'An interactive map of a school building for new students and visitors, with room search and accessible routes.',
    impact: [
      { icon: 'access', label: 'Accessibility' },
      { icon: 'gear', label: 'Technology' },
      { icon: 'users', label: 'Campus impact' },
    ],
    builtWith: 'Floor plans, web map, QR codes',
  },
  {
    kind: 'example',
    mockup: '',
    icon: 'spark',
    title: 'Energy Watch',
    summary: 'A dashboard that shows when classrooms leave lights and devices on, and how much energy the campus could save.',
    impact: [
      { icon: 'leaf', label: 'Sustainability' },
      { icon: 'chart', label: 'Data' },
      { icon: 'users', label: 'Campus impact' },
    ],
    builtWith: 'Light sensors, microcontrollers, dashboard',
  },
  {
    kind: 'example',
    mockup: '',
    icon: 'users',
    title: 'Club Match',
    summary: 'A short quiz that matches students with clubs and organizations that fit their interests and schedule.',
    impact: [
      { icon: 'heart', label: 'Community' },
      { icon: 'gear', label: 'Technology' },
      { icon: 'users', label: 'Campus impact' },
    ],
    builtWith: 'Web app, club directory',
  },
]
