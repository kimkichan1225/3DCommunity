// src/systems/route/RouteSystem.ts

import * as THREE from 'three';
import { calculateDistance, calculateBearing, getClosestPointOnSegment, batchConvertCoordinates } from '../../utils/coordinates';
import { CoordinateSystem } from '../../utils/coordinates';
import type { LngLat, Route, IRouteSystem, CoordinateConverter } from '../../types';
import { ROUTE_CONFIG, NETWORK_CONFIG } from '../../utils/config';

/**
 * 경로 시스템
 * - Mapbox Directions API로부터 경로 로드
 * - 3D 경로 시각화
 * - 경로 추종 알고리즘
 */
export class RouteSystem implements IRouteSystem {
  private routes = new Map<string, Route>();
  private coordinator: CoordinateConverter;
  private mapboxToken: string;

  constructor(coordinator: CoordinateConverter, mapboxToken: string) {
    this.coordinator = coordinator;
    this.mapboxToken = mapboxToken;
  }

  /**
   * Mapbox Directions API로부터 경로 로드
   */
  async loadRoute(start: LngLat, end: LngLat): Promise<Route> {
    const url = this.buildDirectionsURL(start, end);

    try {
      const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), NETWORK_CONFIG.directionsAPITimeout)
        )
      ]);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const route = data.routes[0];

      if (!route) throw new Error('No route found');

      // Polyline 디코딩
      const coordinates = this.decodePolyline(route.geometry);

      // World 좌표로 변환
      const worldPoints = batchConvertCoordinates(
        this.coordinator as CoordinateSystem,
        coordinates
      );

      const routeData: Route = {
        id: `route-${Date.now()}`,
        points: coordinates,
        distance: route.distance || calculateDistance(start, end),
        duration: route.duration || 0,
        worldPoints,
        currentIndex: 0
      };

      this.routes.set(routeData.id, routeData);
      console.log(`✅ 경로 로드: ${routeData.distance.toFixed(0)}m`);

      return routeData;
    } catch (error) {
      console.error('경로 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 경로 시각화 (TubeGeometry)
   */
  visualizeRoute(route: Route): THREE.Mesh {
    if (route.mesh) return route.mesh;

    // Catmull-Rom 곡선으로 부드럽게 보간
    const curve = new THREE.CatmullRomCurve3(route.worldPoints);

    // 곡선을 따라 튜브 생성
    const geometry = new THREE.TubeGeometry(
      curve,
      route.worldPoints.length * 2, // tubularSegments
      ROUTE_CONFIG.tubeRadius,
      ROUTE_CONFIG.tubeTesselation,
      false // closedPath
    );

    const material = new THREE.MeshBasicMaterial({
      color: ROUTE_CONFIG.lineColor,
      transparent: true,
      opacity: ROUTE_CONFIG.lineOpacity
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `route-${route.id}`;

    route.mesh = mesh;
    return mesh;
  }

  /**
   * 경로상 가장 가까운 포인트 찾기
   */
  findClosestPointOnRoute(
    worldPos: THREE.Vector3,
    route: Route
  ): { point: THREE.Vector3; index: number } {
    let minDist = Infinity;
    let closestPoint = new THREE.Vector3();
    let closestIndex = 0;

    for (let i = 0; i < route.worldPoints.length - 1; i++) {
      const p1 = route.worldPoints[i];
      const p2 = route.worldPoints[i + 1];

      const { closestPoint: cp, distance } = getClosestPointOnSegment(worldPos, p1, p2);

      if (distance < minDist) {
        minDist = distance;
        closestPoint = cp;
        closestIndex = i;
      }
    }

    // 현재 인덱스 업데이트
    route.currentIndex = closestIndex;

    return { point: closestPoint, index: closestIndex };
  }

  /**
   * 다음 웨이포인트 계산 (Lookahead)
   */
  getNextWaypoint(
    worldPos: THREE.Vector3,
    route: Route,
    lookahead: number = ROUTE_CONFIG.pathLookahead
  ): THREE.Vector3 {
    const { index } = this.findClosestPointOnRoute(worldPos, route);

    let accumulated = 0;
    let currentIdx = index;

    while (currentIdx < route.worldPoints.length - 1) {
      const p1 = route.worldPoints[currentIdx];
      const p2 = route.worldPoints[currentIdx + 1];
      const segmentDist = p1.distanceTo(p2);

      if (accumulated + segmentDist >= lookahead) {
        // 목표 포인트가 이 선분 위에 있음
        const ratio = (lookahead - accumulated) / segmentDist;
        return p1.clone().lerp(p2, Math.max(0, Math.min(1, ratio)));
      }

      accumulated += segmentDist;
      currentIdx++;
    }

    // 경로 끝에 도달
    return route.worldPoints[route.worldPoints.length - 1].clone();
  }

  /**
   * 경로 완료 여부 확인
   */
  isRouteComplete(worldPos: THREE.Vector3, route: Route, threshold: number = 2): boolean {
    const lastPoint = route.worldPoints[route.worldPoints.length - 1];
    const distance = worldPos.distanceTo(lastPoint);
    return distance < threshold;
  }

  /**
   * 경로 삭제
   */
  removeRoute(routeId: string): void {
    const route = this.routes.get(routeId);
    if (route && route.mesh) {
      route.mesh.geometry.dispose();
      (route.mesh.material as THREE.Material).dispose();
    }
    this.routes.delete(routeId);
  }

  /**
   * 모든 경로 삭제
   */
  clearRoutes(): void {
    this.routes.forEach(route => {
      this.removeRoute(route.id);
    });
    this.routes.clear();
  }

  /**
   * 경로 반환
   */
  getRoute(routeId: string): Route | undefined {
    return this.routes.get(routeId);
  }

  /**
   * Directions API URL 구성
   */
  private buildDirectionsURL(start: LngLat, end: LngLat): string {
    const coordinates = `${start[0]},${start[1]};${end[0]},${end[1]}`;

    return (
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${coordinates}?` +
      `geometries=geojson&` +
      `overview=full&` +
      `access_token=${this.mapboxToken}`
    );
  }

  /**
   * Polyline 디코딩 (Google Polyline Algorithm)
   */
  private decodePolyline(geometry: {type: string; coordinates: number[][]}): LngLat[] {
    if (geometry.type === 'LineString') {
      return geometry.coordinates.map(c => [c[0], c[1]] as LngLat);
    }
    return [];
  }

  /**
   * 배치 경로 로드
   */
  async loadMultipleRoutes(routeSpecs: Array<{start: LngLat; end: LngLat}>): Promise<Route[]> {
    const results = await Promise.allSettled(
      routeSpecs.map(spec => this.loadRoute(spec.start, spec.end))
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<Route>).value);
  }
}
