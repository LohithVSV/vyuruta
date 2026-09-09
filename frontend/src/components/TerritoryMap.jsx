import { useRef, useState } from "react";

import { territories } from "../data/cityData";

import backgroundSea from "../assets/maps/background-sea.png";

import "./TerritoryMap.css";


function TerritoryMap() {
  const [selectedTerritory, setSelectedTerritory] = useState(null);

  const [zoom, setZoom] = useState(0.8);

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const [dragging, setDragging] = useState(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const startingOffset = useRef({
    x: 0,
    y: 0,
  });


  /* =========================
     PAN
  ========================= */

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;

    setDragging(true);

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    startingOffset.current = {
      x: offset.x,
      y: offset.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };


  const handlePointerMove = (e) => {
    if (!dragging) return;

    const dx =
      e.clientX - dragStart.current.x;

    const dy =
      e.clientY - dragStart.current.y;

    setOffset({
      x:
        startingOffset.current.x + dx,

      y:
        startingOffset.current.y + dy,
    });
  };


  const stopDragging = (e) => {
    setDragging(false);

    if (
      e.currentTarget.hasPointerCapture(
        e.pointerId
      )
    ) {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      );
    }
  };


  /* =========================
     ZOOM
  ========================= */

  const handleWheel = (e) => {
    e.preventDefault();

    setZoom((currentZoom) => {
      const amount =
        e.deltaY > 0 ? -0.08 : 0.08;

      return Math.min(
        Math.max(
          currentZoom + amount,
          0.45
        ),
        2.5
      );
    });
  };


  const zoomIn = () => {
    setZoom((z) =>
      Math.min(z + 0.15, 2.5)
    );
  };


  const zoomOut = () => {
    setZoom((z) =>
      Math.max(z - 0.15, 0.45)
    );
  };


  const resetMap = () => {
    setZoom(0.8);

    setOffset({
      x: 0,
      y: 0,
    });
  };


  /* =========================
     100 SEA TILES
  ========================= */

  const seaTiles = Array.from(
    { length: 100 },
    (_, index) => index
  );


  return (
    <div
      className={`territory-map ${
        dragging ? "dragging" : ""
      }`}

      onWheel={handleWheel}

      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >

      {/* =================================
          WORLD
      ================================= */}

      <div
        className="map-world"

        style={{
          transform: `
            translate(
              ${offset.x}px,
              ${offset.y}px
            )
            scale(${zoom})
          `,
        }}
      >

        {/* ===============================
            10 × 10 SEA
        =============================== */}

        <div className="sea-grid">

          {seaTiles.map((tile) => (
            <div
              key={tile}
              className="sea-tile"
              style={{
                backgroundImage: `
                  url(${backgroundSea})
                `,
              }}
            />
          ))}

        </div>


        {/* ===============================
            REALM LABELS
        =============================== */}

        <div className="realm-title fire-title">
          <span>AGNI</span>
          <small>FIRE REALM</small>
        </div>


        <div className="realm-title water-title">
          <span>JALA</span>
          <small>WATER REALM</small>
        </div>


        {/* ===============================
            ISLANDS
        =============================== */}

        {territories.map((territory) => {

          const isSelected =
            selectedTerritory?.id ===
            territory.id;


          return (
            <div
              key={territory.id}

              className={`
                territory
                territory-${territory.element}
                ${
                  isSelected
                    ? "territory-selected"
                    : ""
                }
              `}

              style={{
                left: `${territory.position.x}%`,
                top: `${territory.position.y}%`,

                "--rotation":
                  `${territory.rotation || 0}deg`,

                "--scale":
                  territory.scale || 1,
              }}

              onPointerDown={(e) => {
                e.stopPropagation();
              }}

              onClick={(e) => {
                e.stopPropagation();

                setSelectedTerritory(
                  territory
                );
              }}
            >

              <img
                src={territory.image}
                alt={territory.name}
                draggable="false"
              />

              <div className="territory-name">
                {territory.name}
              </div>

            </div>
          );
        })}

      </div>


      {/* =================================
          MAP CONTROLS
      ================================= */}

      <div className="map-controls">

        <button onClick={zoomIn}>
          +
        </button>

        <div className="zoom-level">
          {Math.round(zoom * 100)}%
        </div>

        <button onClick={zoomOut}>
          −
        </button>

        <button
          className="reset-button"
          onClick={resetMap}
        >
          ↺
        </button>

      </div>


      {/* =================================
          TERRITORY INFO
      ================================= */}

      {selectedTerritory && (

        <div className="territory-info">

          <button
            className="close-info"

            onClick={() =>
              setSelectedTerritory(null)
            }
          >
            ×
          </button>


          <div
            className={`info-element ${
              selectedTerritory.element
            }`}
          >
            {selectedTerritory.element ===
            "fire"
              ? "🔥 FIRE TERRITORY"
              : "💧 WATER TERRITORY"}
          </div>


          <h2>
            {selectedTerritory.name}
          </h2>


          <p>
            Territory of the{" "}
            {selectedTerritory.element ===
            "fire"
              ? "Agni"
              : "Jala"}{" "}
            realm.
          </p>

        </div>
      )}


      {/* =================================
          HELP
      ================================= */}

      <div className="map-hint">
        🖱 Drag to explore&nbsp;&nbsp; • &nbsp;&nbsp;
        Scroll to zoom
      </div>

    </div>
  );
}


export default TerritoryMap;