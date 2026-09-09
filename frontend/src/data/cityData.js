import agni1 from "../assets/maps/states/agni-1.png";
import agni2 from "../assets/maps/states/agni-2.png";
import agni3 from "../assets/maps/states/agni-3.png";
import agni4 from "../assets/maps/states/agni-4.png";
import agni5 from "../assets/maps/states/agni-5.png";

import jala1 from "../assets/maps/states/jala-1.png";
import jala2 from "../assets/maps/states/jala-2.png";
import jala3 from "../assets/maps/states/jala-3.png";
import jala4 from "../assets/maps/states/jala-4.png";
import jala5 from "../assets/maps/states/jala-5.png";

export const territories = [
  // =========================
  // AGNI - LEFT
  // =========================

  {
    id: "agni-1",
    name: "Agni-1",
    element: "fire",
    image: agni1,
    position: { x: 10, y: 10 },
    scale: 1,
  },

  {
    id: "agni-2",
    name: "Agni-2",
    element: "fire",
    image: agni2,
    position: { x: 34, y: 16 },
    scale: 0.95,
  },

  {
    id: "agni-3",
    name: "Agni-3",
    element: "fire",
    image: agni3,
    position: { x: 2, y: 48 },
    scale: 1.05,
  },

  {
    id: "agni-4",
    name: "Agni-4",
    element: "fire",
    image: agni4,
    position: { x: 35, y: 53 },
    scale: 0.92,
  },

  {
    id: "agni-5",
    name: "Agni-5",
    element: "fire",
    image: agni5,
    position: { x: 18, y: 79 },
    scale: 1,
  },

  // =========================
  // JALA - RIGHT
  // =========================

  {
    id: "jala-1",
    name: "Jala-1",
    element: "water",
    image: jala1,
    position: { x: 72, y: 9 },
    scale: 1,
  },

  {
    id: "jala-2",
    name: "Jala-2",
    element: "water",
    image: jala2,
    position: { x: 95, y: 22 },
    scale: 0.95,
  },

  {
    id: "jala-3",
    name: "Jala-3",
    element: "water",
    image: jala3,
    position: { x: 68, y: 48 },
    scale: 1.05,
  },

  {
    id: "jala-4",
    name: "Jala-4",
    element: "water",
    image: jala4,
    position: { x: 110, y: 53 },
    scale: 0.92,
  },

  {
    id: "jala-5",
    name: "Jala-5",
    element: "water",
    image: jala5,
    position: { x: 89, y: 79 },
    scale: 1,
  },
];