const adjectives = [
  'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Neon', 'Violet', 'Amber',
  'Crimson', 'Indigo', 'Teal', 'Coral', 'Jade', 'Cobalt', 'Scarlet', 'Ivory',
  'Onyx', 'Azure', 'Magenta', 'Copper',
];

const nouns = [
  'Fox', 'Panda', 'Wolf', 'Hawk', 'Bear', 'Tiger', 'Dragon', 'Phoenix',
  'Raven', 'Lynx', 'Cobra', 'Falcon', 'Otter', 'Jaguar', 'Panther', 'Moose',
  'Viper', 'Bison', 'Crane', 'Elk',
];

const colors = [
  '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

export function generateUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

export function generateColor(): string {
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getUseridentity(): { name: string; color: string; id: string } {
  if (typeof window === 'undefined') return { name: '', color: '', id: '' };

  const stored = localStorage.getItem('dropboard-user');
  if (stored) {
    return JSON.parse(stored);
  }

  const identity = {
    name: generateUsername(),
    color: generateColor(),
    id: crypto.randomUUID(),
  };
  localStorage.setItem('dropboard-user', JSON.stringify(identity));
  return identity;
}
