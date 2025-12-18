/**
 * Mapbox 지도 관리자
 * - 지도 초기화
 * - 좌표 변환
 * - 기본 지도 관리 기능
 */
import mapboxgl from 'mapbox-gl';
import { CoordinateSystem } from '../../utils/coordinates';

export class MapboxManager {
  constructor(config) {
    this.map = null;
    this.container = null;
    this.config = config;
    this.coordinateConverter = null;
  }

  /**
   * Mapbox 초기화
   * @param {HTMLElement} container HTML 요소
   * @param {Object} config 설정 (선택사항)
   * @returns {Promise} 초기화 완료 Promise
   */
  initialize(container, config) {
    if (!this.config.accessToken) {
      console.error('Mapbox accessToken이 설정되지 않았습니다.');
      return Promise.reject(new Error('Invalid mapbox token'));
    }

    mapboxgl.accessToken = this.config.accessToken;
    this.container = container;

    // 설정 병합
    const mergedConfig = {
      ...this.config,
      ...config
    };

    // 지도 생성
    this.map = new mapboxgl.Map({
      container: this.container,
      style: mergedConfig.style,
      center: mergedConfig.center,
      zoom: mergedConfig.zoom,
      pitch: mergedConfig.pitch,
      bearing: mergedConfig.bearing,
      antialias: true,
      optimizeForTerrain: true // 지형 최적화
    });

    // 좌표 변환 시스템 초기화
    this.coordinateConverter = new CoordinateSystem(mergedConfig.center, mergedConfig.zoom);

    // 로드 완료 대기 및 Promise 반환
    return new Promise((resolve, reject) => {
      this.map.on('load', () => {
        console.log('✅ Mapbox 지도 초기화 완료');
        resolve();
      });
      
      this.map.on('error', (err) => {
        console.error('❌ Mapbox 오류:', err);
        reject(err);
      });
    });
  }

  /**
   * 지도 객체 반환
   */
  getMap() {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    return this.map;
  }

  /**
   * 좌표 변환기 반환
   */
  getCoordinateConverter() {
    if (!this.coordinateConverter) {
      throw new Error('CoordinateConverter가 초기화되지 않았습니다.');
    }
    return this.coordinateConverter;
  }

  /**
   * 현재 지도 중심 반환
   */
  getCenter() {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    const center = this.map.getCenter();
    return [center.lng, center.lat];
  }

  /**
   * 지도 중심 변경
   */
  setCenter(lngLat, animate = true) {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    if (animate) {
      this.map.easeTo({
        center: lngLat,
        duration: 500
      });
    } else {
      this.map.setCenter(lngLat);
    }

    // 좌표 변환기 업데이트
    if (this.coordinateConverter) {
      this.coordinateConverter.updateCenter(lngLat);
    }
  }

  /**
   * 줌 레벨 변경
   */
  setZoom(zoom, animate = true) {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    if (animate) {
      this.map.easeTo({
        zoom,
        duration: 500
      });
    } else {
      this.map.setZoom(zoom);
    }

    // 좌표 변환기 업데이트
    if (this.coordinateConverter) {
      this.coordinateConverter.setZoomLevel(zoom);
    }
  }

  /**
   * 현재 줌 레벨
   */
  getZoom() {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    return this.map.getZoom();
  }

  /**
   * 지도에 마커 추가
   */
  addMarker(lngLat, color = '#ff0000', label) {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    const el = document.createElement('div');
    el.style.backgroundColor = color;
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';

    const marker = new mapboxgl.Marker(el).setLngLat(lngLat);

    if (label) {
      marker.setPopup(new mapboxgl.Popup().setText(label));
    }

    marker.addTo(this.map);
    return el;
  }

  /**
   * 지도 스타일 변경
   */
  setStyle(styleUrl) {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    this.map.setStyle(styleUrl);

    return new Promise((resolve) => {
      this.map.once('styledata', resolve);
    });
  }

  /**
   * 지도 렌더링 트리거 (필요 시에만)
   */
  triggerRepaint() {
    if (!this.map) return;
    this.map.triggerRepaint();
  }

  /**
   * 정리
   */
  dispose() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.coordinateConverter = null;
    this.container = null;
  }
}
