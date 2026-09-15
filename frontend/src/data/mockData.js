// src/data/mockData.js

export const mockTeam = {
  name: "Team Ashfall",
  faction: "fire", // "fire" | "water"
  username: "ashfall_lead",
  college: "SVEC College of Engineering",
  currency: 240,
  citiesHeld: 4,
  wins: 12,
  losses: 3,
  streak: 3,
  hostingRights: true,
};

export const mockBattles = [
  {
    id: "b1",
    opponent: "Team Cobra",
    status: "awaiting_time_slot",
    city: "Delta-7",
  },
  {
    id: "b2",
    opponent: "Team Nexus",
    status: "terms_sent",
    city: "Echo-3",
  },
];

export const mockTeamHistory = [
  { id: "h1", type: "claim", text: "Claimed Delta-7", time: "2h ago" },
  { id: "h2", type: "loss", text: "Lost Echo-3 to Team Cobra", time: "1d ago" },
  { id: "h3", type: "win", text: "Won battle vs Team Nexus", time: "3d ago" },
];

export const mockActivityFeed = [
  { id: "a1", text: "Team Cobra claimed Delta-7", time: "10m ago" },
  { id: "a2", text: "Team Nexus won a battle vs Team Vortex", time: "45m ago" },
  { id: "a3", text: "Team Ashfall paid tribute for Gamma-2", time: "2h ago" },
  { id: "a4", text: "Team Solaris achieved a 3-win streak", time: "5h ago" },
];