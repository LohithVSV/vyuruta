import { useState } from 'react';
import './TerritoryMap.css';

const ROWS = 10, COLS = 10, SIZE = 34;

function generateMockCities() {
  const cities = [];
  let i = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const roll = Math.random();
      cities.push({
        id: `city-${i++}`,
        row: r,
        col: c,
        faction: roll < 0.4 ? 'agni' : roll < 0.8 ? 'jal' : 'unclaimed',
      });
    }
  }
  return cities;
}

export default function TerritoryMap() {
  const [cities] = useState(generateMockCities);
  const [hovered, setHovered] = useState(null);

  const hexPoints = (cx, cy) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + SIZE * Math.cos(angle)},${cy + SIZE * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="map-wrap">
      <svg viewBox="0 0 420 380" className="map-svg">
        {cities.map((city) => {
          const x = 40 + city.col * (SIZE * 1.5);
          const y = 30 + city.row * (SIZE * 0.87) + (city.col % 2 === 0 ? 0 : SIZE * 0.43);
          const isHovered = hovered === city.id;
          return (
            <polygon
              key={city.id}
              points={hexPoints(x, y)}
              className={`hex hex-${city.faction} ${isHovered ? 'hex-hovered' : ''}`}
              onMouseEnter={() => setHovered(city.id)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
      {hovered && <p className="map-hint">{hovered}</p>}
    </div>
  );
}