// One player = one city. No teams, factions or hosting rights.

export const mockPlayer = {
  id: "p1",
  name: "Lohith",
  city: { id: "agni-1-3", name: "Ember Hold" },
  currency: 20000,
  wins: 4,
  losses: 1,
  streak: 2,
};

export const mockPlayers = [
  { id: "p2", name: "Ravi", city: { id: "jala-2-4", name: "Tide Keep" } },
  { id: "p3", name: "Sneha", city: { id: "agni-3-1", name: "Cinder Gate" } },
  { id: "p4", name: "Arjun", city: { id: "jala-1-7", name: "Reef Tower" } },
];

export const DEFAULT_TERMS = {
  format: "DSA Sprint",
  questions: 3,
  minutes: 30,
};

// status: proposed -> terms_accepted -> scheduled -> done | rejected
// direction: incoming (someone challenged me) | outgoing (I challenged them)
export const mockBattles = [
  {
    id: "b1",
    direction: "incoming",
    opponent: "Sneha",
    cityName: "Ember Hold",
    status: "proposed",
    terms: { ...DEFAULT_TERMS },
    slot: "Sat, 6:00 PM",
  },
  {
    id: "b2",
    direction: "incoming",
    opponent: "Arjun",
    cityName: "Ember Hold",
    status: "terms_accepted",
    terms: { ...DEFAULT_TERMS, minutes: 45 },
    slot: "Sun, 4:30 PM",
  },
  {
    id: "b3",
    direction: "outgoing",
    opponent: "Ravi",
    cityName: "Tide Keep",
    status: "scheduled",
    terms: { ...DEFAULT_TERMS },
    slot: "Fri, 8:00 PM",
  },
];

export const mockFeed = [
  { id: "f1", text: "Sneha won a DSA Sprint against Ravi", time: "2h ago" },
  { id: "f2", text: "Arjun claimed Reef Tower", time: "5h ago" },
  { id: "f3", text: "Lohith defended Ember Hold", time: "1d ago" },
  { id: "f4", text: "Ravi paid 2000 tribute to Sneha", time: "1d ago" },
  { id: "f5", text: "New player joined: Kiran (Cinder Gate)", time: "2d ago" },
];

export const mockHistory = [
  { id: "h1", text: "Won vs Arjun (defended Ember Hold)", time: "1d ago" },
  { id: "h2", text: "Won daily challenge (+150)", time: "1d ago" },
  { id: "h3", text: "Lost vs Sneha", time: "4d ago" },
];