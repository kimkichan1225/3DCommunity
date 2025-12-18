// src/core/map/MapboxManager.ts

import type mapboxgl from 'mapbox-gl';
import { CoordinateSystem } from '../../utils/coordinates';
import type { MapboxConfig, LngLat, CoordinateConverter, IMapboxManager } from '../../types';

/**
 * Mapbox 지도 관리자
 * - 지도 초기화
 * - 좌표 변환
 * - 미니맵 관리
 */
export class MapboxManager implements IMapboxManager {
  private map: mapboxgl.Map | null = null;
  private container: HTMLElement | null = null;
  private config: MapboxConfig;
  private coordinateConverter: CoordinateSystem | null = null;

  constructor(config: MapboxConfig) {
    this.config = config;
  }

  /**
   * Mapbox 초기화
   * @param container HTML 요소 ID 또는 요소
   * @param config 설정 (선택사항)
   */
  async initialize(container: HTMLElement, config?: Partial<MapboxConfig>): Promise<void> {
    // 동적 import (Tree-shaking 최적화)
    const mapboxgl = (await import('mapbox-gl')).default;

    if (!this.config.accessToken) {
      console.error('Mapbox accessToken이 설정되지 않았습니다.');
      throw new Error('Invalid mapbox token');
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
      center: mergedConfig.center as [number, number],
      zoom: mergedConfig.zoom,
      pitch: mergedConfig.pitch,
      bearing: mergedConfig.bearing,
      antialias: true,
      optimizeForTerrain: true // 지형 최적화
    });

    // 좌표 변환 시스템 초기화
    this.coordinateConverter = new CoordinateSystem(mergedConfig.center, mergedConfig.zoom);

    // 로드 완료 대기
    await new Promise((resolve) => {
      this.map!.on('load', resolve);
    });

    console.log('✅ Mapbox 지도 초기화 완료');
  }

  /**
   * 지도 객체 반환
   */
  getMap(): mapboxgl.Map {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    return this.map;
  }

  /**
   * 좌표 변환기 반환
   */
  getCoordinateConverter(): CoordinateConverter {
    if (!this.coordinateConverter) {
      throw new Error('CoordinateConverter가 초기화되지 않았습니다.');
    }
    return this.coordinateConverter;
  }

  /**
   * 현재 지도 중심 반환
   */
  getCenter(): LngLat {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    const center = this.map.getCenter();
    return [center.lng, center.lat];
  }

  /**
   * 지도 중심 변경
   */
  setCenter(lngLat: LngLat, animate: boolean = true): void {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    if (animate) {
      this.map.easeTo({
        center: lngLat as [number, number],
        duration: 500
      });
    } else {
      this.map.setCenter(lngLat as [number, number]);
    }

    // 좌표 변환기 업데이트
    if (this.coordinateConverter) {
      this.coordinateConverter.updateCenter(lngLat);
    }
  }

  /**
   * 줌 레벨 변경
   */
  setZoom(zoom: number, animate: boolean = true): void {
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
  getZoom(): number {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');
    return this.map.getZoom();
  }

  /**
   * 지도에 마커 추가
   */
  addMarker(lngLat: LngLat, color: string = '#ff0000', label?: string): HTMLElement {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    // mapboxgl은 이미 로드되어 있음
    const Marker = (window as any).mapboxgl.Marker;
    const Popup = (window as any).mapboxgl.Popup;

    const el = document.createElement('div');
    el.style.backgroundColor = color;
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.borderRadius = '50%';
    el.style.cursor = 'pointer';

    const marker = new Marker(el).setLngLat(lngLat as [number, number]);

    if (label) {
      marker.setPopup(new Popup().setText(label));
    }

    marker.addTo(this.map);
    return el;
  }

  /**
   * 지도 스타일 변경
   */
  setStyle(styleUrl: string): Promise<void> {
    if (!this.map) throw new Error('Mapbox가 초기화되지 않았습니다.');

    this.map.setStyle(styleUrl);

    return new Promise((resolve) => {
      this.map!.once('styledata', resolve);
    });
  }

  /**
   * 지도 렌더링 트리거 (필요 시에만)
   */
  triggerRepaint(): void {
    if (!this.map) return;
    this.map.triggerRepaint();
  }

  /**
   * 정리
   */
  dispose(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.coordinateConverter = null;
    this.container = null;
  }
}
