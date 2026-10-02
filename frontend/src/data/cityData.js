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
    citySpots: [
      { x: 30, y: 25 }, { x: 52, y: 17 }, { x: 70, y: 29 }, { x: 23, y: 42 },
      { x: 45, y: 38 }, { x: 67, y: 47 }, { x: 33, y: 57 }, { x: 56, y: 59 },
      { x: 44, y: 73 }, { x: 71, y: 68 },
    ],
  },

  {
    id: "agni-2",
    name: "Agni-2",
    element: "fire",
    image: agni2,
    position: { x: 34, y: 16 },
    scale: 0.95,
    citySpots: [
      { x: 42, y: 18 }, { x: 62, y: 24 }, { x: 28, y: 32 }, { x: 47, y: 36 },
      { x: 70, y: 41 }, { x: 32, y: 51 }, { x: 56, y: 53 }, { x: 24, y: 66 },
      { x: 47, y: 71 }, { x: 68, y: 66 },
    ],
  },

  {
    id: "agni-3",
    name: "Agni-3",
    element: "fire",
    image: agni3,
    position: { x: 10, y: 48 },
    scale: 1.05,
    citySpots: [
      { x: 38, y: 20 }, { x: 58, y: 23 }, { x: 73, y: 32 }, { x: 25, y: 34 },
      { x: 47, y: 39 }, { x: 66, y: 44 }, { x: 31, y: 53 }, { x: 53, y: 58 },
      { x: 72, y: 65 }, { x: 44, y: 73 },
    ],
  },

  {
    id: "agni-4",
    name: "Agni-4",
    element: "fire",
    image: agni4,
    position: { x: 35, y: 53 },
    scale: 0.92,
    citySpots: [
      { x: 30, y: 24 }, { x: 52, y: 18 }, { x: 72, y: 28 }, { x: 22, y: 41 },
      { x: 46, y: 42 }, { x: 67, y: 45 }, { x: 32, y: 58 }, { x: 55, y: 61 },
      { x: 43, y: 75 }, { x: 72, y: 68 },
    ],
  },

  {
    id: "agni-5",
    name: "Agni-5",
    element: "fire",
    image: agni5,
    position: { x: 18, y: 79 },
    scale: 1,
    citySpots: [
      { x: 34, y: 22 }, { x: 52, y: 17 }, { x: 67, y: 25 }, { x: 28, y: 36 },
      { x: 47, y: 34 }, { x: 64, y: 42 }, { x: 30, y: 53 }, { x: 48, y: 55 },
      { x: 66, y: 61 }, { x: 55, y: 76 },
    ],
  },

  // =========================
  // JALA - RIGHT
  // =========================

  {
    id: "jala-1",
    name: "Jala-1",
    element: "water",
    image: jala1,
    position: { x: 72, y: 15 },
    scale: 1,
    citySpots: [
      { x: 33, y: 21 }, { x: 52, y: 17 }, { x: 70, y: 27 }, { x: 23, y: 38 },
      { x: 44, y: 37 }, { x: 65, y: 42 }, { x: 31, y: 54 }, { x: 54, y: 57 },
      { x: 73, y: 62 }, { x: 45, y: 75 },
    ],
  },

  {
    id: "jala-2",
    name: "Jala-2",
    element: "water",
    image: jala2,
    position: { x: 95, y: 22 },
    scale: 0.95,
    citySpots: [
      { x: 30, y: 16 }, { x: 51, y: 15 }, { x: 69, y: 19 }, { x: 82, y: 28 },
      { x: 23, y: 30 }, { x: 44, y: 30 }, { x: 64, y: 31 }, { x: 79, y: 41 },
      { x: 35, y: 48 }, { x: 58, y: 47 },
    ],
  },

  {
    id: "jala-3",
    name: "Jala-3",
    element: "water",
    image: jala3,
    position: { x: 68, y: 48 },
    scale: 1.05,
    citySpots: [
      { x: 39, y: 18 }, { x: 58, y: 22 }, { x: 72, y: 31 }, { x: 27, y: 34 },
      { x: 48, y: 38 }, { x: 66, y: 44 }, { x: 33, y: 52 }, { x: 51, y: 57 },
      { x: 69, y: 65 }, { x: 46, y: 72 },
    ],
  },

  {
    id: "jala-4",
    name: "Jala-4",
    element: "water",
    image: jala4,
    position: { x: 90, y: 53 },
    scale: 0.92,
    citySpots: [
      { x: 40, y: 17 }, { x: 59, y: 21 }, { x: 26, y: 32 }, { x: 48, y: 34 },
      { x: 70, y: 38 }, { x: 29, y: 48 }, { x: 52, y: 51 }, { x: 72, y: 57 },
      { x: 38, y: 66 }, { x: 57, y: 74 },
    ],
  },

  {
    id: "jala-5",
    name: "Jala-5",
    element: "water",
    image: jala5,
    position: { x: 89, y: 79 },
    scale: 1,
    citySpots: [
      { x: 25, y: 22 }, { x: 42, y: 16 }, { x: 68, y: 20 }, { x: 80, y: 34 },
      { x: 24, y: 42 }, { x: 73, y: 48 }, { x: 30, y: 60 }, { x: 44, y: 67 },
      { x: 65, y: 64 }, { x: 81, y: 62 },
    ],
  },
];