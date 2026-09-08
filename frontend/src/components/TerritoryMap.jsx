import React, { useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { generateMap, STATES, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from "../data/cityData";
import "./TerritoryMap.css";

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

import cityMarkerFire from "../assets/maps/markers/city-fire.png";
import cityMarkerWater from "../assets/maps/markers/city-water.png";

const ISLAND_IMAGES = {
  "agni-1": agni1, "agni-2": agni2, "agni-3": agni3, "agni-4": agni4, "agni-5": agni5,
  "jala-1": jala1, "jala-2": jala2, "jala-3": jala3, "jala-4": jala4, "jala-5": jala5,
};

const CITY_MARKER = { fire: cityMarkerFire, water: cityMarkerWater };
const MARKER_SIZE = 30;

export default function TerritoryMap() {
  const { cities } = useMemo(() => generateMap({ mockOwners: true }), []);

  return (
    <div className="territory-map-wrapper">
      <TransformWrapper
        initialScale={0.28}
        minScale={0.15}
        maxScale={4}
        wheel={{ step: 0.15 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperClass="tm-transform-wrapper"
          contentClass="tm-transform-content"
        >
          <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="tm-svg">
            <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} className="tm-ocean" />

            {STATES.map((state) => (
              <g key={state.name}>
                <image
                  href={ISLAND_IMAGES[state.image]}
                  x={state.tileX}
                  y={state.tileY}
                  width={state.tileSize}
                  height={state.tileSize}
                  preserveAspectRatio="xMidYMid slice"
                  className={`tm-island tm-island--${state.faction}`}
                />
                <text
                  x={state.tileX + state.tileSize / 2}
                  y={state.tileY - 24}
                  textAnchor="middle"
                  className={`tm-state-label tm-state-label--${state.faction}`}
                >
                  {state.name.toUpperCase()}
                </text>
              </g>
            ))}

            {cities.map((city) => (
              <image
                key={city.id}
                href={CITY_MARKER[city.faction]}
                x={city.x - MARKER_SIZE / 2}
                y={city.y - MARKER_SIZE}
                width={MARKER_SIZE}
                height={MARKER_SIZE}
                className={`tm-city tm-city--${city.faction} ${
                  city.owner ? "tm-city--claimed" : "tm-city--unclaimed"
                }`}
              >
                <title>{city.id} — {city.owner ?? "unclaimed"}</title>
              </image>
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}