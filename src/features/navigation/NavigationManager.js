/**
 * 네비게이션 매니저
 * Mapbox Directions API, 경로 표시
 */

import * as THREE from 'three';
import axios from 'axios';

export class NavigationManager {
  constructor(map, scene, coordSystem) {
    this.map = map;
    this.scene = scene;
    this.coordSystem = coordSystem;

    this.currentRoute = null;
    this.routeLine = null;
    this.waypointMarkers = [];
    this.isNavigating = false;
    this.mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
  }

  /**
   * Mapbox Directions API로 경로 요청
   * @param {Object} start - 시작점 { lng, lat }
   * @param {Object} end - 도착점 { lng, lat }
   * @returns {Promise<Object>} 경로 데이터
   */
  async requestRoute(start, end) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${end.lng},${end.lat}`;

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          geometries: 'geojson',
          overview: 'full',
          steps: true,
        },
      });

      if (response.data.routes.length === 0) {
        console.warn('❌ No route found');
        return null;
      }

      const route = response.data.routes[0];
      console.log(`✅ Route found: ${(route.distance / 1000).toFixed(2)}km, ${(route.duration / 60).toFixed(1)}min`);

      return route;
    } catch (error) {
      console.error('❌ Directions API Error:', error);
      return null;
    }
  }

  /**
   * 경로 시각화 (3D 라인)
   * @param {Object} route - Directions API 응답
   */
  visualizeRoute(route) {
    if (!route) return;

    // 기존 라인 제거
    if (this.routeLine) {
      this.scene.remove(this.routeLine);
    }

    const coordinates = route.geometry.coordinates;
    const points = coordinates.map((coord) => {
      // GPS → Three.js 월드 좌표
      return this.coordSystem.gpsToWorld(
        { lng: coord[0], lat: coord[1] },
        0.1 // Y축: 약간 위
      );
    });

    // LineGeometry 생성
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);

    // 재질 (파란 선)
    const material = new THREE.LineBasicMaterial({
      color: 0x0066ff,
      linewidth: 3,
      fog: false,
    });

    // 선 오브젝트
    this.routeLine = new THREE.Line(geometry, material);
    this.scene.add(this.routeLine);

    this.currentRoute = route;
    this.isNavigating = true;

    console.log(`✅ Route visualized with ${points.length} points`);
  }

  /**
   * 경로 따라가기 (네비게이션 실행)
   * @param {THREE.Vector3} playerWorldPos - 플레이어 현재 위치
   * @returns {Object} 네비게이션 정보
   */
  getNavigationInfo(playerWorldPos) {
    if (!this.currentRoute) return null;

    const coordinates = this.currentRoute.geometry.coordinates;
    const steps = this.currentRoute.steps;

    // 플레이어와 가장 가까운 경로점 찾기
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const wpWorldPos = this.coordSystem.gpsToWorld(
        { lng: coord[0], lat: coord[1] },
        0.1
      );
      const distance = playerWorldPos.distanceTo(wpWorldPos);

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    // 다음 목표 지점
    const nextIndex = Math.min(nearestIndex + 10, coordinates.length - 1);
    const nextCoord = coordinates[nextIndex];
    const nextWorldPos = this.coordSystem.gpsToWorld(
      { lng: nextCoord[0], lat: nextCoord[1] },
      0.1
    );

    // 거리, 방향 계산
    const distanceToNext = playerWorldPos.distanceTo(nextWorldPos);
    const direction = new THREE.Vector3();
    direction.subVectors(nextWorldPos, playerWorldPos);
    direction.normalize();

    return {
      nextWaypoint: nextWorldPos,
      nextCoord: nextCoord,
      distanceToNext,
      direction,
      progress: ((nearestIndex + 1) / coordinates.length) * 100,
      totalDistance: this.currentRoute.distance,
      totalDuration: this.currentRoute.duration,
    };
  }

  /**
   * 경로 표시 중지
   */
  clearRoute() {
    if (this.routeLine) {
      this.scene.remove(this.routeLine);
      this.routeLine = null;
    }

    this.waypointMarkers.forEach((marker) => {
      this.scene.remove(marker);
    });
    this.waypointMarkers = [];

    this.currentRoute = null;
    this.isNavigating = false;

    console.log('🛑 Route cleared');
  }

  /**
   * 도착 확인 (거리로 판단)
   * @param {THREE.Vector3} playerPos
   * @param {number} threshold - 도착 판정 거리 (기본: 5m)
   * @returns {boolean}
   */
  isArrived(playerPos, threshold = 5) {
    if (!this.currentRoute) return false;

    const coordinates = this.currentRoute.geometry.coordinates;
    const endCoord = coordinates[coordinates.length - 1];
    const endWorldPos = this.coordSystem.gpsToWorld(
      { lng: endCoord[0], lat: endCoord[1] },
      0.1
    );

    const distance = playerPos.distanceTo(endWorldPos);
    return distance < threshold;
  }
}
