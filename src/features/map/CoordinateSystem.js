/**
 * 좌표 시스템 변환 관리자
 * GPS ↔ Mercator ↔ Three.js 월드 좌표 변환
 */

import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';

export class CoordinateSystem {
  /**
   * @param {Object} originGPS - 원점 GPS 좌표 { lng, lat }
   */
  constructor(originGPS) {
    this.originGPS = originGPS;
    
    // Mercator 좌표 계산 및 캐시
    this.originMerc = mapboxgl.MercatorCoordinate.fromLngLat(
      [originGPS.lng, originGPS.lat],
      0
    );
    this.originMercX = this.originMerc.x;
    this.originMercY = this.originMerc.y;
    
    // 위도별 미터/Mercator 단위 환산
    this.metersPerMercatorUnit = this.calculateMetersPerUnit(originGPS.lat);
  }

  /**
   * Web Mercator에서 1 단위 = 실제 거리(m) 계산
   * @param {number} lat - 위도
   * @returns {number} 미터 단위
   */
  calculateMetersPerUnit(lat) {
    const earthCircumference = 40075017; // 지구 둘레 (미터)
    const latRad = (lat * Math.PI) / 180;
    return earthCircumference * Math.cos(latRad);
  }

  /**
   * GPS 좌표 → Three.js 월드 좌표 변환
   * @param {Object} gps - { lng, lat }
   * @param {number} height - Y축 높이 (기본값: 0)
   * @returns {THREE.Vector3} 월드 좌표
   */
  gpsToWorld(gps, height = 0) {
    const merc = mapboxgl.MercatorCoordinate.fromLngLat(
      [gps.lng, gps.lat],
      0
    );

    // Mercator 상대 위치 (원점 기준)
    const deltaMercX = merc.x - this.originMercX;
    const deltaMercY = merc.y - this.originMercY;

    // 미터 단위로 변환
    const deltaX = deltaMercX * this.metersPerMercatorUnit;
    const deltaZ = -deltaMercY * this.metersPerMercatorUnit; // Z축은 반대

    return new THREE.Vector3(deltaX, height, deltaZ);
  }

  /**
   * Three.js 월드 좌표 → GPS 좌표 변환 (역변환)
   * @param {THREE.Vector3} worldPos - 월드 좌표
   * @returns {Object} { lng, lat }
   */
  worldToGps(worldPos) {
    // 미터 → Mercator 단위로 역변환
    const deltaMercX = worldPos.x / this.metersPerMercatorUnit;
    const deltaMercY = -worldPos.z / this.metersPerMercatorUnit; // Z축 반대

    // 원점 기준 Mercator 좌표
    const mercX = this.originMercX + deltaMercX;
    const mercY = this.originMercY + deltaMercY;

    // Mercator → LngLat
    const merc = new mapboxgl.MercatorCoordinate(mercX, mercY, 0);
    const lngLat = merc.toLngLat();

    return { lng: lngLat.lng, lat: lngLat.lat };
  }

  /**
   * Haversine 공식으로 두 GPS 점 사이 거리 계산
   * @param {Object} gps1 - { lng, lat }
   * @param {Object} gps2 - { lng, lat }
   * @returns {number} 거리 (미터)
   */
  haversineDistance(gps1, gps2) {
    const R = 6371000; // 지구 반지름 (미터)
    const lat1 = (gps1.lat * Math.PI) / 180;
    const lat2 = (gps2.lat * Math.PI) / 180;
    const deltaLat = ((gps2.lat - gps1.lat) * Math.PI) / 180;
    const deltaLng = ((gps2.lng - gps1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 두 GPS 점을 잇는 방향 계산 (북쪽 기준 라디안)
   * @param {Object} from - 시작점 { lng, lat }
   * @param {Object} to - 끝점 { lng, lat }
   * @returns {number} 방향 (라디안, -π ~ π)
   */
  calculateBearing(from, to) {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    return Math.atan2(y, x);
  }
}
