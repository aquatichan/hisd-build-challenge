// Judging rubric + deliverables. DRAFT: adapted from the Westside Build Challenge (whs-build-2627.web.app)
// for the district event. Set `status` to 'final' once the district confirms the wording.
export const judging = {
  status: 'draft', // 'draft' | 'final'
  note: 'Draft, adapted from the Westside pilot. The final rubric is announced at kickoff.',
  deadline: null, // ISO date when confirmed, e.g. '2027-02-15'

  rubric: [
    { name: 'Impact', points: 30, full: 'Solves a real, specific problem for students, teachers or staff at your school or in Houston, and you can show who it helps.' },
    { name: 'Technical execution', points: 25, full: 'The core features work in the demo, and every team member can explain how it works.' },
    { name: 'Realistic to adopt', points: 20, full: 'Clear about what a school would need (people, devices, cost, rules) to start using it.' },
    { name: 'Design & ease of use', points: 15, full: 'Someone new can use it without help. It is clear, readable and accessible.' },
    { name: 'Pitch', points: 10, full: 'Explains the problem, the fix and the impact clearly within the time limit.' },
  ],

  deliverables: [
    { icon: 'code', title: 'Public code repo', text: 'Judges read the source here, so make sure the repository is public.' },
    { icon: 'arrowUpRight', title: 'Working demo link', text: 'Host web apps on Firebase, Vercel, Netlify or similar. For phone apps, link a video of your team using it.' },
    { icon: 'share', title: '2-minute pitch video', text: 'The problem, who it helps and how it works. Upload to YouTube or Google Drive and set it to public.' },
    { icon: 'school', title: 'What your school would need', text: 'Anything needed to adopt it: devices, training, staff time, cost.' },
  ],
  aiNote: 'The submission form also asks which AI tools you used and what for.',
}
