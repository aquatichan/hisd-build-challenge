// Details & people. Anything not confirmed says so plainly; replace text as it is confirmed.
export const facts = [
  { icon: 'calendar', title: 'The competition', text: 'A district-wide, student-led build challenge.' },
  { icon: 'users', title: 'Who can participate', text: 'Houston ISD students. Full eligibility and team-size rules posting soon.' },
  { icon: 'flag', title: 'The exhibition', text: 'A digital showcase featuring student projects and stories.' },
]

export const rules = {
  status: 'confirmed', // rules are confirmed; the text is not published on the site yet
  note: 'Rules, eligibility and team size are confirmed. The official text will be posted here.',
}

// People: three groups, each a carousel in the people section. `members` fills in as people are confirmed:
//   { name: 'Full Name', role: 'Title / school', photo: '/people/full-name.jpg' }
// While a group is empty its carousel shows labeled placeholder frames (no faces).
// `slug` picks the placeholder art (public/placeholders/people-<slug>-1..5.jpg).
export const people = [
  { group: 'District organizers', slug: 'organizers', members: [] },
  { group: 'School leads', slug: 'leads', members: [] },
  { group: 'Founding team', slug: 'founders', members: [] },
]
