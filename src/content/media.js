// Images used across the site. Everything here is a labeled PLACEHOLDER (made by scripts/make-placeholders.mjs).
// To swap in real photos: drop files into public/photos/ (only with signed photo releases) and change `src`.

export const photos = [
  { src: '/placeholders/photo-01.jpg', alt: 'Placeholder for a build day photo', title: 'Build day' },
  { src: '/placeholders/photo-04.jpg', alt: 'Placeholder for a photo of Westside students', title: 'Westside students' },
  { src: '/placeholders/photo-02.jpg', alt: 'Placeholder for a team at work photo', title: 'Team at work' },
  { src: '/placeholders/photo-05.jpg', alt: 'Placeholder for a photo of Carnegie Vanguard students', title: 'Carnegie Vanguard students' },
  { src: '/placeholders/photo-03.jpg', alt: 'Placeholder for a prototype testing photo', title: 'Prototype testing' },
  { src: '/placeholders/photo-06.jpg', alt: 'Placeholder for a photo of Bellaire students', title: 'Bellaire students' },
  { src: '/placeholders/photo-07.jpg', alt: 'Placeholder for a demo day photo', title: 'Demo day' },
  { src: '/placeholders/photo-08.jpg', alt: 'Placeholder for a pitch practice photo', title: 'Pitch practice' },
]

// Collectible cards for participating schools (front art per school). Keyed by NCES name.
export const schoolCards = {
  'Bellaire High School': '/placeholders/school-bellaire.jpg',
  'Carnegie Vanguard High School': '/placeholders/school-carnegie.jpg',
  'Westside High School': '/placeholders/school-westside.jpg',
}

// Sponsor / partner stickers. Click a sticker to peel it off and reveal who they are.
// name: company name · pitch: one sentence on what the company does · provides: what they give the challenge.
// Leave pitch/provides empty ('') until the sponsor confirms the wording; the card shows "Details coming soon".
export const sponsors = [
  { src: '/sponsors/graphify.png', name: 'Graphify Labs', note: 'YC S26', pitch: '', provides: '', width: 150, rotate: -8 },
  { src: '/placeholders/sponsor-02.png', name: 'Sponsor 02', note: 'Placeholder', pitch: '', provides: '', width: 170, rotate: 6 },
  { src: '/placeholders/sponsor-03.png', name: 'Sponsor 03', note: 'Placeholder', pitch: '', provides: '', width: 190, rotate: -4 },
  { src: '/placeholders/sponsor-04.png', name: 'Sponsor 04', note: 'Placeholder', pitch: '', provides: '', width: 150, rotate: 9 },
]
