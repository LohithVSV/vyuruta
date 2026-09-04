import React, { useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { generateCities, CLUSTERS } from "../data/cityData";
import "./TerritoryMap.css";

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 900;

export default function TerritoryMap() {
  // mockOwners: true just so you can SEE glow/color while backend isn't wired up yet
  const cities = useMemo(() => generateCities({ mockOwners: true }), []);

  return (
    <div className="territory-map-wrapper">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        wheel={{ step: 0.15 }}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperClass="tm-transform-wrapper"
          contentClass="tm-transform-content"
        >
          <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="tm-svg">
            <rect x="0" y="0" width={VIEWBOX_WIDTH / 2} height={VIEWBOX_HEIGHT} className="tm-bg-fire" />
            <rect x={VIEWBOX_WIDTH / 2} y="0" width={VIEWBOX_WIDTH / 2} height={VIEWBOX_HEIGHT} className="tm-bg-water" />

            {CLUSTERS.map((cluster) => (
              <text
                key={cluster.name}
                x={cluster.cx}
                y={cluster.cy - 150}
                textAnchor="middle"
                className={`tm-cluster-label tm-cluster-label--${cluster.faction}`}
              >
                {cluster.name}
              </text>
            ))}

            {cities.map((city) => (
              <circle
                key={city.id}
                cx={city.x}
                cy={city.y}
                r={city.owner ? 10 : 7}
                className={
                  city.owner
                    ? `tm-city tm-city--claimed tm-city--${city.faction}`
                    : "tm-city tm-city--unclaimed"
                }
              >
                <title>{city.id}{city.owner ? ` — ${city.owner}` : " — unclaimed"}</title>
              </circle>
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}