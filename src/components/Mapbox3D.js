import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token must be provided via environment variable
// e.g. set REACT_APP_MAPBOX_TOKEN in .env
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

export default function Mapbox3D({ onMapReady, initialCenter = [127.0276, 37.4979], initialZoom = 15, isFull = false }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      console.warn('REACT_APP_MAPBOX_TOKEN is not set. Please add your Mapbox token.');
    }

    if (mapRef.current) return; // already initialized

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 60,
      bearing: -17.5,
      antialias: true
    });

    map.on('load', () => {
      // Add DEM source for terrain (Mapbox default)
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.terrain-rgb',
          'tileSize': 512
        });
      }

      // Enable terrain with slight exaggeration
      try {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });
      } catch (e) {
        console.warn('Terrain not available in this style/account:', e);
      }

      // 3D buildings layer (Mapbox example)
      const layers = map.getStyle().layers;
      let labelLayerId = null;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );

      // Expose helper to parent: convert lngLat to mercator + scale (for Three.js integration)
      const project = (lngLat, altitude = 0) => {
        const merc = mapboxgl.MercatorCoordinate.fromLngLat({ lng: lngLat[0], lat: lngLat[1] }, altitude);
        return {
          translateX: merc.x,
          translateY: merc.y,
          translateZ: merc.z,
          // number of mercator units per meter at this latitude
          meterInMercatorCoordinateUnits: merc.meterInMercatorCoordinateUnits
            ? merc.meterInMercatorCoordinateUnits()
            : 1
        };
      };

      mapRef.current = map;

      if (onMapReady) onMapReady({ map, project });
    });

    return () => {
      if (map && map.remove) map.remove();
    };
  }, [onMapReady, initialCenter, initialZoom]);

  // When container visibility/size changes (isFull), make sure map resizes
  useEffect(() => {
    if (isFull && mapRef.current) {
      // slight delay to let layout update
      setTimeout(() => {
        try {
          mapRef.current.resize();
        } catch (e) {
          // ignore
        }
      }, 50);
    }
  }, [isFull]);

  return <div ref={mapContainer} className={`map-container ${isFull ? 'map-full' : ''}`} />;
}
