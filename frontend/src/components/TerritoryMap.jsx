import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { territories } from "../data/cityData";
import { DEFAULT_TERMS } from "../data/mockData";
import backgroundSea from "../assets/maps/background-sea.png";
import fireCityMarker from "../assets/maps/markers/city-fire.png";
import waterCityMarker from "../assets/maps/markers/city-water.png";
import "./TerritoryMap.css";

const WORLD = 2400;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.05;
const TAP_SLOP = 6;
const HOME_CITY_ZOOM = 2.48;

// Builds the list of all 100 map spots. `owners` maps a map id like "agni-1-3"
// to { ownerId, ownerName, cityName, cityDbId } (comes from the backend).
function buildCities(owners) {
  return territories.flatMap((territory) =>
    territory.citySpots.map((_, index) => {
      const id = `${territory.id}-${index + 1}`;
      const owner = owners[id];
      const name =
        owner?.cityName ||
        `${territory.name} Forest ${String(index + 1).padStart(2, "0")}`;
      return {
        id,
        territory,
        index,
        owner,
        name,
        searchName: owner ? name : `${name} - ${territory.name}`,
      };
    })
  );
}

function getTerritoryPosition(territory, isMobile) {
  if (!isMobile) return territory.position;

  const column = territories
    .filter((item) => item.element === territory.element)
    .findIndex((item) => item.id === territory.id);

  return {
    x: 10 + column * 20,
    y: territory.element === "fire" ? 30 : 50,
  };
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function clampView({ x, y, z }, vw, vh, minZoom) {
  const nz = clamp(z, minZoom, MAX_ZOOM);
  const ww = WORLD * nz;
  const hh = WORLD * nz;
  return {
    z: nz,
    x: ww <= vw ? clamp(x, 0, vw - ww) : clamp(x, vw - ww, 0),
    y: hh <= vh ? clamp(y, 0, vh - hh) : clamp(y, vh - hh, 0),
  };
}

function TerritoryMap({ player, owners = {}, battles = [], setBattles }) {
  const OWNERS = owners;
  const CITIES = useMemo(() => buildCities(owners), [owners]);
  const homeTerritory =
    territories.find((territory) =>
      player.city?.id?.startsWith(`${territory.id}-`)
    ) ?? null;
  const homeCityMarker = player.city?.id?.startsWith("jala-") ? waterCityMarker : fireCityMarker;
  const rootRef = useRef(null);
  const overviewZoomRef = useRef(MIN_ZOOM);
  const [view, setView] = useState({ x: 0, y: 0, z: 0.8 });
  const viewRef = useRef(view);
  const [animating, setAnimating] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedIsland, setSelectedIsland] = useState(homeTerritory);
  const [citySearch, setCitySearch] = useState("");
  const [panelMode, setPanelMode] = useState("profile");
  const [battleQuestions, setBattleQuestions] = useState(DEFAULT_TERMS.questions);
  const [battleMinutes, setBattleMinutes] = useState(DEFAULT_TERMS.minutes);
  const [battleSlot, setBattleSlot] = useState("");
  const [battleError, setBattleError] = useState("");

  const pointers = useRef(new Map());
  const gesture = useRef({ mode: "none" });
  const moved = useRef(false);
  const cityRefs = useRef({});

  const size = () => {
    const r = rootRef.current.getBoundingClientRect();
    return { vw: r.width, vh: r.height, left: r.left, top: r.top };
  };

  const apply = useCallback((next) => {
    if (!rootRef.current) return;
    const { vw, vh } = size();
    const v = clampView(next, vw, vh, overviewZoomRef.current);
    viewRef.current = v;
    setView(v);
  }, []);

  const fitOverview = useCallback(() => {
    const { vw, vh } = size();
    const isMobile = window.innerWidth <= 700;
    const islandSize = isMobile ? 155 : 220;
    const halfIslandWidth = islandSize / 2;
    const halfIslandHeight = islandSize * 0.375;
    const sidebar = rootRef.current?.parentElement.querySelector(".map-sidebar");
    const sidebarHeight = isMobile
      ? sidebar?.getBoundingClientRect().height ?? 0
      : 0;
    const search = rootRef.current?.querySelector(".map-search");
    const topOffset = isMobile
      ? (search?.getBoundingClientRect().bottom ?? 0) + 12
      : 0;
    const bounds = territories.reduce(
      (current, territory) => {
        const position = getTerritoryPosition(territory, isMobile);
        const x = (position.x / 100) * WORLD;
        const y = (position.y / 100) * WORLD;
        return {
          left: Math.min(current.left, x - halfIslandWidth),
          right: Math.max(current.right, x + halfIslandWidth),
          top: Math.min(current.top, y - halfIslandHeight),
          bottom: Math.max(current.bottom, y + halfIslandHeight),
        };
      },
      { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity },
    );
    const padding = 16;
    const availableHeight = vh - sidebarHeight - topOffset;
    const z = Math.min(
      (vw - padding * 2) / (bounds.right - bounds.left),
      (availableHeight - padding * 2) / (bounds.bottom - bounds.top),
      MAX_ZOOM,
    );
    overviewZoomRef.current = Math.max(z, MIN_ZOOM);
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    apply({
      z,
      x: vw / 2 - centerX * z,
      y: topOffset + availableHeight / 2 - centerY * z,
    });
  }, [apply]);

  /* zoom about a screen point (relative to the map container) */
  const zoomAt = useCallback(
    (newZ, cx, cy) => {
      const v = viewRef.current;
      const z = clamp(newZ, overviewZoomRef.current, MAX_ZOOM);
      const wx = (cx - v.x) / v.z;
      const wy = (cy - v.y) / v.z;
      apply({ z, x: cx - wx * z, y: cy - wy * z });
    },
    [apply]
  );

  /* mouse wheel (needs non-passive listener) */
  useEffect(() => {
    const el = rootRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomAt(viewRef.current.z * factor, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  /* ---------- pointer gestures: 1 finger pan, 2 finger pinch ---------- */
  const startPan = (p) => {
    gesture.current = {
      mode: "pan",
      sx: p.x, sy: p.y,
      ox: viewRef.current.x, oy: viewRef.current.y,
    };
  };

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()];
    const { left, top } = size();
    const mx = (a.x + b.x) / 2 - left;
    const my = (a.y + b.y) / 2 - top;
    const v = viewRef.current;
    gesture.current = {
      mode: "pinch",
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      z: v.z,
      wx: (mx - v.x) / v.z,
      wy: (my - v.y) / v.z,
    };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      moved.current = false;
      startPan({ x: e.clientX, y: e.clientY });
    } else if (pointers.current.size === 2) {
      moved.current = true;
      startPinch();
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (g.mode === "pan") {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.hypot(dx, dy) > TAP_SLOP) moved.current = true;
      if (moved.current) apply({ ...viewRef.current, x: g.ox + dx, y: g.oy + dy });
    } else if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const { left, top } = size();
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mx = (a.x + b.x) / 2 - left;
      const my = (a.y + b.y) / 2 - top;
      const z = g.z * (dist / g.dist);
      apply({ z, x: mx - g.wx * z, y: my - g.wy * z });
      // apply() clamps z, so keep the stored world point consistent
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      startPan([...pointers.current.values()][0]);
    } else if (pointers.current.size === 0) {
      gesture.current = { mode: "none" };
    }
  };

  /* a drag should not count as a tap on a city or island */
  const onClickCapture = (e) => {
    if (moved.current) {
      e.stopPropagation();
      moved.current = false;
    }
  };

  /* ---------- buttons ---------- */
  const zoomIn = () => {
    const { vw, vh } = size();
    zoomAt(viewRef.current.z * 1.25, vw / 2, vh / 2);
  };
  const zoomOut = () => {
    const { vw, vh } = size();
    zoomAt(viewRef.current.z / 1.25, vw / 2, vh / 2);
  };
  const resetMap = () => {
    setSelectedCity(null);
    setPanelMode("profile");
    if (homeTerritory) {
      focusIsland(homeTerritory, HOME_CITY_ZOOM);
    } else {
      fitOverview();
    }
  };

  const smoothApply = useCallback((next) => {
    setAnimating(true);
    apply(next);
    setTimeout(() => setAnimating(false), 400);
  }, [apply]);

  const focusIsland = useCallback((t, zoom = 1.3) => {
    const { vw, vh } = size();
    const isMobile = window.innerWidth <= 700;
    const sidebar = rootRef.current?.parentElement.querySelector(".map-sidebar");
    const sidebarHeight = isMobile
      ? sidebar?.getBoundingClientRect().height ?? 0
      : 0;
    const search = rootRef.current?.querySelector(".map-search");
    const topOffset = isMobile
      ? (search?.getBoundingClientRect().bottom ?? 0) + 12
      : 0;
    const centerY = topOffset + (vh - sidebarHeight - topOffset) / 2;
    const z = zoom;
    const position = getTerritoryPosition(t, isMobile);
    const cx = (position.x / 100) * WORLD;
    const cy = (position.y / 100) * WORLD;
    smoothApply({ z, x: vw / 2 - cx * z, y: centerY - cy * z });
  }, [smoothApply]);

  const focusCity = useCallback((city, zoom = HOME_CITY_ZOOM) => {
    const marker = cityRefs.current[city.id];
    if (!marker || !rootRef.current) return;
    const markerRect = marker.getBoundingClientRect();
    const rootRect = rootRef.current.getBoundingClientRect();
    const { vw, vh } = size();
    const current = viewRef.current;
    const worldX = (markerRect.left + markerRect.width / 2 - rootRect.left - current.x) / current.z;
    const worldY = (markerRect.top + markerRect.height / 2 - rootRect.top - current.y) / current.z;
    const isMobile = window.innerWidth <= 700;
    const sidebar = rootRef.current.parentElement.querySelector(".map-sidebar");
    const sidebarHeight = isMobile
      ? sidebar?.getBoundingClientRect().height ?? 0
      : 0;
    const search = rootRef.current.querySelector(".map-search");
    const topOffset = isMobile
      ? (search?.getBoundingClientRect().bottom ?? 0) + 12
      : 0;
    const centerY = topOffset + (vh - sidebarHeight - topOffset) / 2;
    const z = zoom;
    smoothApply({ z, x: vw / 2 - worldX * z, y: centerY - worldY * z });
  }, [smoothApply]);

  /* Fit the realm, then bring the player's home island into focus. */
  useEffect(() => {
    fitOverview();
    let focusFrame;
    if (homeTerritory) {
      focusFrame = window.requestAnimationFrame(() =>
        focusIsland(homeTerritory, HOME_CITY_ZOOM)
      );
    }
    const onResize = () => {
      fitOverview();
      if (homeTerritory) {
        window.requestAnimationFrame(() =>
          focusIsland(homeTerritory, HOME_CITY_ZOOM)
        );
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, [fitOverview, focusIsland, homeTerritory]);

  /* ---------- selection ---------- */
  const selectCity = (t, index) => {
    const id = `${t.id}-${index + 1}`;
    const owner = OWNERS[id];
    setSelectedIsland(t);
    setSelectedCity({
      id,
      name:
        owner?.cityName ||
        `${t.name} Forest ${String(index + 1).padStart(2, "0")}`,
      island: t.name,
      element: t.element,
      ownerId: owner?.ownerId || null,
      ownerName: owner?.ownerName || null,
      isMine: owner?.ownerId === player.id,
      dbId: owner?.cityDbId || null,
    });
    setPanelMode("profile");
  };

  const searchCity = (query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;
    const city = CITIES.find(
      (item) => item.searchName.toLowerCase() === normalized || item.name.toLowerCase() === normalized
    );
    if (!city) return;
    setCitySearch(city.searchName);
    setSelectedIsland(city.territory);
    selectCity(city.territory, city.index);
    focusCity(city, MAX_ZOOM);
  };

  const sendBattleRequest = (event) => {
    event.preventDefault();
    if (!selectedCity || !battleSlot.trim()) {
      setBattleError("Add a proposed time to continue.");
      return;
    }
    setBattles?.((current) => [
      {
        id: `b${Date.now()}`,
        direction: "outgoing",
        opponent: selectedCity.ownerName,
        cityName: selectedCity.name,
        status: "proposed",
        terms: {
          format: "DSA Sprint",
          questions: Number(battleQuestions),
          minutes: Number(battleMinutes),
        },
        slot: battleSlot.trim(),
      },
      ...current,
    ]);
    setBattleError("");
    setPanelMode("sent");
  };

  const updateBattle = (id, status) => {
    setBattles?.((current) => current.map((battle) =>
      battle.id === id ? { ...battle, status } : battle
    ));
  };

  const pendingBattleCount = battles.filter((battle) =>
    battle.direction === "incoming" && ["proposed", "terms_accepted"].includes(battle.status)
  ).length;

  const stop = (e) => e.stopPropagation();
  const activeCityId = selectedCity?.id;

  return (
    <div className="map-workspace">
      <div
        ref={rootRef}
        className="territory-map"
        style={{
          backgroundImage: `url(${backgroundSea})`,
          backgroundSize: `${(WORLD / 6) * view.z}px auto`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onClick={() => {
          setSelectedCity(null);
          setPanelMode("profile");
        }}
      >
      <form
        className="map-search"
        onPointerDown={stop}
        onClick={stop}
        onSubmit={(e) => {
          e.preventDefault();
          const normalized = citySearch.trim().toLowerCase();
          if (!normalized) return;
          const match = CITIES.find((city) =>
            city.searchName.toLowerCase().includes(normalized)
          );
          if (match) searchCity(match.searchName);
        }}
      >
        <input
          aria-label="Search cities"
          autoComplete="off"
          list="map-city-options"
          onChange={(e) => {
            const value = e.target.value;
            setCitySearch(value);
            const exactMatch = CITIES.find(
              (city) => city.searchName.toLowerCase() === value.trim().toLowerCase()
            );
            if (exactMatch) searchCity(exactMatch.searchName);
          }}
          placeholder="Search cities..."
          type="search"
          value={citySearch}
        />
        <datalist id="map-city-options">
          {CITIES.map((city) => (
            <option key={city.id} value={city.searchName} />
          ))}
        </datalist>
        <button type="submit">Find</button>
      </form>

      <div
        className="map-world"
        style={{
          width: WORLD,
          height: WORLD,
          left: 0,
          top: 0,
          marginLeft: 0,
          marginTop: 0,
          transformOrigin: "0 0",
          transition: animating ? "transform 0.35s ease" : "none",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
        }}
      >
        <div className="realm-title fire-title">
          <span>AGNI</span>
          <small>FIRE REALM</small>
        </div>
        <div className="realm-title water-title">
          <span>JALA</span>
          <small>WATER REALM</small>
        </div>

        {territories.map((t) => (
          <div
            key={t.id}
            className={`map-island map-island-${t.element} ${
              selectedIsland?.id === t.id ? "map-island-selected" : ""
            }`}
            style={{
              left: `${getTerritoryPosition(t, window.innerWidth <= 700).x}%`,
              top: `${getTerritoryPosition(t, window.innerWidth <= 700).y}%`,
              "--rotation": `${t.rotation || 0}deg`,
              "--scale": t.scale || 1,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIsland(t);
              setSelectedCity(null);
              setPanelMode("profile");
              focusIsland(t, Math.max(viewRef.current.z, 1.3));
            }}
          >
            <img src={t.image} alt={t.name} draggable="false" />

            {t.citySpots.map((s, i) => {
              const id = `${t.id}-${i + 1}`;
              const owner = OWNERS[id];
              const cls = owner
                ? owner.ownerId === player.id
                  ? "pin-mine"
                  : "pin-owned"
                : "pin-wild";
              const marker = t.element === "fire" ? fireCityMarker : waterCityMarker;
              return (
                <button
                  key={id}
                  className={`city-pin ${cls} ${
                    activeCityId === id ? `pin-selected pin-selected-${t.element}` : ""
                  }`}
                  ref={(element) => {
                    if (element) cityRefs.current[id] = element;
                    else delete cityRefs.current[id];
                  }}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  aria-label={`${owner?.cityName || `${t.name} Forest ${String(i + 1).padStart(2, "0")}`} - ${t.name}`}
                  title={`${owner?.cityName || `${t.name} Forest ${String(i + 1).padStart(2, "0")}`} - ${t.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectCity(t, i);
                  }}
                >
                  <img src={marker} alt="" draggable="false" />
                </button>
              );
            })}

            <div className="territory-name">{t.name}</div>
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="map-controls" onPointerDown={stop} onClick={stop}>
        <button onClick={zoomIn}>+</button>
        <div className="zoom-level">{Math.round(view.z * 100)}%</div>
        <button onClick={zoomOut}>−</button>
        <button className="reset-button" onClick={resetMap}>↺</button>
      </div>

      {!selectedCity && (
        <div className="map-hint">Drag to explore · Pinch or scroll to zoom · Tap a city</div>
      )}
      </div>

      <aside className="map-sidebar" onPointerDown={stop} onClick={stop}>
        <div className="sidebar-topline">
          <span className="sidebar-kicker">VYURUTA / FIELD RECORD</span>
          {panelMode !== "profile" && (
            <button
              className="sidebar-back"
              onClick={() => {
                setPanelMode("profile");
                setSelectedCity(null);
              }}
            >
              ← Your profile
            </button>
          )}
        </div>

        {panelMode === "profile" && (
          <>
            <div className="sidebar-profile">
              <img className="profile-city-art" src={homeCityMarker} alt="" />
              <div>
                <p className="sidebar-eyebrow">YOUR TERRITORY</p>
                <h1>{player.name}</h1>
                <p className="profile-city-name">{player.city?.name || "No city yet"}</p>
              </div>
            </div>
            <div className="sidebar-stats">
              <div><span>COINS</span><strong>{player.currency.toLocaleString()}</strong></div>
              <div><span>WINS</span><strong>{player.wins}</strong></div>
              <div><span>LOSSES</span><strong>{player.losses}</strong></div>
              <div><span>STREAK</span><strong>{player.streak}</strong></div>
            </div>
            <button className="sidebar-link" onClick={() => setPanelMode("battles")}>
              <span>Battle requests</span>
              <span className="sidebar-count">{pendingBattleCount}</span>
            </button>
          </>
        )}

        {panelMode === "city" && selectedCity && (
          <section className="sidebar-content">
            <p className={`sidebar-eyebrow element-${selectedCity.element}`}>
              {selectedCity.element === "fire" ? "AGNI TERRITORY" : "JALA TERRITORY"}
            </p>
            <h1>{selectedCity.name}</h1>
            <p className="sidebar-subtitle">{selectedCity.island}</p>
            <div className="city-owner-row">
              <span>RULER</span>
              <strong>{selectedCity.ownerName || "Unallocated"}</strong>
            </div>
            <p className="sidebar-copy">
              {selectedCity.isMine
                ? "This is your home city."
                : selectedCity.ownerName
                  ? `${selectedCity.ownerName} holds this city.`
                  : "This city has not been claimed yet."}
            </p>
            {selectedCity.ownerName && !selectedCity.isMine && (
              <button className="sidebar-primary" onClick={() => setPanelMode("battle-setup")}>
                Send battle request
              </button>
            )}
          </section>
        )}

        {panelMode === "battle-setup" && selectedCity && (
          <form className="sidebar-content battle-setup" onSubmit={sendBattleRequest}>
            <p className="sidebar-eyebrow">BATTLE ATTRIBUTES</p>
            <h1>Challenge {selectedCity.ownerName}</h1>
            <p className="sidebar-subtitle">For {selectedCity.name}</p>
            <label className="sidebar-field">
              Questions
              <select value={battleQuestions} onChange={(event) => setBattleQuestions(event.target.value)}>
                {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count} questions</option>)}
              </select>
            </label>
            <label className="sidebar-field">
              Time limit
              <select value={battleMinutes} onChange={(event) => setBattleMinutes(event.target.value)}>
                {[15, 30, 45, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
              </select>
            </label>
            <label className="sidebar-field">
              Proposed time
              <input
                type="text"
                placeholder="e.g. Sat, 6:00 PM"
                value={battleSlot}
                onChange={(event) => setBattleSlot(event.target.value)}
              />
            </label>
            {battleError && <p className="battle-error">{battleError}</p>}
            <button className="sidebar-primary" type="submit">Send challenge</button>
          </form>
        )}

        {panelMode === "sent" && selectedCity && (
          <section className="sidebar-content sent-state">
            <p className="sidebar-eyebrow">REQUEST SENT</p>
            <h1>Challenge on its way</h1>
            <p className="sidebar-copy">Your battle request for {selectedCity.name} was sent to {selectedCity.ownerName}.</p>
            <button className="sidebar-primary" onClick={() => {
              setSelectedCity(null);
              setPanelMode("profile");
            }}>Back to your profile</button>
            <button className="sidebar-secondary" onClick={() => setPanelMode("battles")}>View battle requests</button>
          </section>
        )}

        {panelMode === "battles" && (
          <section className="sidebar-content sidebar-battles">
            <p className="sidebar-eyebrow">ARENA</p>
            <h1>Battle requests</h1>
            {battles.length === 0 && <p className="sidebar-copy">No battles yet.</p>}
            {battles.map((battle) => (
              <article className="sidebar-battle" key={battle.id}>
                <div className="sidebar-battle-title">
                  <strong>{battle.direction === "incoming" ? `${battle.opponent} challenges you` : `You challenged ${battle.opponent}`}</strong>
                  <span>{battle.status.replace("_", " ")}</span>
                </div>
                <p>{battle.cityName} · {battle.terms.questions} questions · {battle.terms.minutes} min</p>
                <p className="battle-slot">{battle.slot}</p>
                {battle.direction === "incoming" && battle.status === "proposed" && (
                  <div className="sidebar-battle-actions">
                    <button onClick={() => updateBattle(battle.id, "terms_accepted")}>Accept terms</button>
                    <button onClick={() => updateBattle(battle.id, "rejected")}>Reject</button>
                  </div>
                )}
                {battle.direction === "incoming" && battle.status === "terms_accepted" && (
                  <div className="sidebar-battle-actions">
                    <button onClick={() => updateBattle(battle.id, "scheduled")}>Accept time</button>
                    <button onClick={() => updateBattle(battle.id, "rejected")}>Reject</button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </aside>
    </div>
  );
}

export default TerritoryMap;