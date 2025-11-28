import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token must be provided via environment variable
// e.g. set REACT_APP_MAPBOX_TOKEN in .env
// Get your token from: https://account.mapbox.com/auth/signin/
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
} else {
  console.error('⚠️  REACT_APP_MAPBOX_TOKEN is not set. Please add your Mapbox token to .env file.');
}

/**
 * Mapbox 3D 지도 컴포넌트
 * 3DMap 폴더의 Map3DRenderer를 참고하여 구현
 * 
 * Props:
 * - onMapReady: 지도가 준비되면 호출되는 콜백 함수
 * - initialCenter: 초기 중심 좌표 [lng, lat]
 * - initialZoom: 초기 줌 레벨 (0-24, 높을수록 확대)
 * - isFull: 전체화면 모드 여부
 */
export default function Mapbox3D({ onMapReady, initialCenter = [127.0276, 37.4979], initialZoom = 18, isFull = false }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState(initialCenter); // 현재 위치를 상태로 관리

  // 로딩 오버레이용 별도 컨테이너
  const loadingOverlayRef = useRef(null);

  // 지도 초기화 전에 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 현재 위치:', latitude, longitude);
          setCenter([longitude, latitude]); // [lng, lat] 순서
        },
        (error) => {
          console.warn('⚠️  위치 정보를 가져올 수 없음:', error.message);
          console.log('기본 위치로 설정합니다.');
          // 오류 시 기본값 사용
        }
      );
    }
  }, []);

  useEffect(() => {
    // 토큰이 없으면 렌더링하지 않음
    if (!MAPBOX_TOKEN) {
      setError('Mapbox token is not configured. Please add REACT_APP_MAPBOX_TOKEN to your .env file.');
      setIsLoading(false);
      return;
    }

    // 이미 초기화된 경우 빈 return (중복 초기화 방지)
    if (mapRef.current) return;

    if (!mapContainer.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center, // 현재 위치로 중심 설정
        zoom: initialZoom,
        pitch: 60,
        bearing: -17.5,
        antialias: true,
        attributionControl: true
      });

      map.on('load', () => {
        console.log('🗺️  Mapbox 지도가 로드되었습니다.');
        setIsLoading(false);
        
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
          console.warn('⚠️  Terrain not available in this style/account:', e);
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

        // 3D 건물 레이어 추가 (3DMap/Map3DRenderer 참고)
        if (!map.getLayer('3d-buildings')) {
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
        }

        // Expose helper to parent: convert lngLat to mercator + scale (for Three.js integration)
        // 3DMap/Map3DRenderer.js의 CoordinateConverter를 참고
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

      map.on('error', (e) => {
        console.error('🚨 Mapbox 에러:', e.error);
        setError(`Map error: ${e.error}`);
        setIsLoading(false);
      });

    } catch (err) {
      console.error('🚨 Mapbox 초기화 에러:', err);
      setError(err.message);
      setIsLoading(false);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // 의존성 배열: center가 변경될 때만 재초기화
  }, [center]);

  // When container visibility/size changes (isFull), make sure map resizes
  useEffect(() => {
    if (isFull && mapRef.current) {
      // slight delay to let layout update
      setTimeout(() => {
        try {
          mapRef.current.resize();
          console.log('🔄 Map resized for full screen mode');
        } catch (e) {
          console.warn('Map resize failed:', e);
        }
      }, 100);
    }
  }, [isFull]);

  return (
    <>
      {/* Mapbox 컨테이너 - 반드시 비어있어야 함 */}
      <div 
        ref={mapContainer} 
        className={`map-container ${isFull ? 'map-full' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      
      {/* 로딩/에러 오버레이 - 별도 컨테이너 */}
      <div
        ref={loadingOverlayRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: isLoading || error ? 1000 : -1,
          pointerEvents: isLoading || error ? 'auto' : 'none'
        }}
      >
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            whiteSpace: 'nowrap'
          }}>
            지도 로딩 중...
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <strong>지도 오류:</strong><br />{error}
          </div>
        )}
      </div>
    </>
  );
}
