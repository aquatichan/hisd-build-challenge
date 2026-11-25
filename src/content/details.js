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

// People: names/portraits not provided yet. `members` fills in as people are confirmed; empty shows "TBD".
export const people = [
  { group: 'District organizers', icon: 'users', members: [] },
  { group: 'School leads', icon: 'school', members: [] },
  { group: 'Student team', icon: 'gear', members: [] },
]
