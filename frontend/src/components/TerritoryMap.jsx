import React, { useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { generateMap, STATES } from "../data/cityData";
import BuildingSymbols from "./BuildingSymbols";
import "./TerritoryMap.css";

const VIEWBOX_WIDTH = 2000;
const VIEWBOX_HEIGHT = 1100;
const FIRE_BUILDING_COUNT = 6;
const WATER_BUILDING_COUNT = 6;

// deterministic hash so the same city always renders the same building
function hashToIndex(str, mod) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000003;
  }
  return hash % mod;
}

export default function TerritoryMap() {
  const { cities } = useMemo(() => generateMap({ mockOwners: true }), []);

  return (
    <div className="territory-map-wrapper">
      <TransformWrapper
        initialScale={0.55}
        minScale={0.35}
        maxScale={3}
        wheel={{ step: 0.15 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperClass="tm-transform-wrapper"
          contentClass="tm-transform-content"
        >
          <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="tm-svg">
            <defs>
              <BuildingSymbols />
            </defs>

            <rect x="0" y="0" width={VIEWBOX_WIDTH / 2} height={VIEWBOX_HEIGHT} className="tm-bg-fire" />
            <rect x={VIEWBOX_WIDTH / 2} y="0" width={VIEWBOX_WIDTH / 2} height={VIEWBOX_HEIGHT} className="tm-bg-water" />
            <polygon
              points={`${VIEWBOX_WIDTH / 2 - 70},0 ${VIEWBOX_WIDTH / 2 + 70},0 ${VIEWBOX_WIDTH / 2 + 40},${VIEWBOX_HEIGHT} ${VIEWBOX_WIDTH / 2 - 40},${VIEWBOX_HEIGHT}`}
              className="tm-divide"
            />

            {STATES.map((state) => (
              <text
                key={state.name}
                x={state.cx}
                y={state.cy - 130}
                textAnchor="middle"
                className={`tm-state-label tm-state-label--${state.faction}`}
              >
                {state.name.toUpperCase()}
              </text>
            ))}

            {cities.map((city) => {
              if (!city.owner) {
                return (
                  <circle
                    key={city.id}
                    cx={city.x}
                    cy={city.y}
                    r={6}
                    className="tm-city tm-city--unclaimed"
                  >
                    <title>{city.id} — unclaimed</title>
                  </circle>
                );
              }

              const poolSize = city.faction === "fire" ? FIRE_BUILDING_COUNT : WATER_BUILDING_COUNT;
              const variant = hashToIndex(city.id, poolSize);
              const symbolId = `#${city.faction}-building-${variant}`;
              const w = 22;
              const h = 34;

              return (
                <use
                  key={city.id}
                  href={symbolId}
                  x={city.x - w / 2}
                  y={city.y - h}
                  width={w}
                  height={h}
                  className={`tm-building tm-building--${city.faction}`}
                >
                  <title>{city.id} — {city.owner}</title>
                </use>
              );
            })}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}