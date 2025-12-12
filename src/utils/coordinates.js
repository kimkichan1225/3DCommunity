/**
 * 좌표 변환 시스템
 * Mapbox 좌표 ↔ Three.js World 좌표 변환
 */
export class CoordinateSystem {
  constructor(centerLngLat, zoomLevel = 16) {
    this.centerLngLat = centerLngLat;
    this.zoomLevel = zoomLevel;
    this.TILE_SIZE = 512;
    this.coordinateCache = new Map();
    
    this.updateScale();
    this.updateCenterMercator();
  }

  /**
   * 스케일 계산 (2^zoom)
   */
  updateScale() {
    this.scale = Math.pow(2, this.zoomLevel);
  }

  /**
   * 중심점 Mercator 좌표 업데이트
   */
  updateCenterMercator() {
    this.centerMercator = this.lngLatToMercator(this.centerLngLat);
  }

  /**
   * Mapbox LngLat → Mercator 정규화 좌표
   */
  lngLatToMercator(lngLat) {
    const lng = lngLat[0];
    const lat = lngLat[1];

    // 경도 → X (0~1)
    const x = (lng + 180) / 360;

    // 위도 → Y (0~1, 메르카토르 투영)
    const latRad = (lat * Math.PI) / 180;
    const sinLat = Math.sin(latRad);
    const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);

    return { x, y, z: 0 };
  }

  /**
   * Mercator → LngLat 역변환
   */
  mercatorToLngLat(merc) {
    const lng = merc.x * 360 - 180;
    const latRad = 2 * Math.atan(Math.exp((0.5 - merc.y) * 4 * Math.PI)) - Math.PI / 2;
    const lat = (latRad * 180) / Math.PI;
    return [lng, lat];
  }

  /**
   * LngLat → Three.js World 좌표 (캐시 포함)
   */
  lngLatToWorld(lngLat, elevation = 0) {
    const cacheKey = `${lngLat[0].toFixed(6)},${lngLat[1].toFixed(6)},${elevation.toFixed(1)}`;

    if (this.coordinateCache.has(cacheKey)) {
      const cached = this.coordinateCache.get(cacheKey);
      return { x: cached.x, y: cached.y, z: cached.z };
    }

    const merc = this.lngLatToMercator(lngLat);
    const deltaX = merc.x - this.centerMercator.x;
    const deltaY = merc.y - this.centerMercator.y;

    const worldX = deltaX * this.scale * this.TILE_SIZE;
    const worldY = elevation;
    const worldZ = deltaY * this.scale * this.TILE_SIZE;

    const result = { x: worldX, y: worldY, z: worldZ };
    this.coordinateCache.set(cacheKey, result);

    return result;
  }

  /**
   * Three.js World → LngLat 역변환
   */
  worldToLngLat(worldPos) {
    const normX = worldPos.x / (this.scale * this.TILE_SIZE) + this.centerMercator.x;
    const normY = worldPos.z / (this.scale * this.TILE_SIZE) + this.centerMercator.y;

    return this.mercatorToLngLat({ x: normX, y: normY });
  }

  /**
   * 중심점 재설정 (Floating-point 안정화)
   */
  updateCenter(lngLat) {
    this.centerLngLat = lngLat;
    this.updateCenterMercator();
    this.coordinateCache.clear();
  }

  /**
   * 줌 레벨 변경
   */
  setZoomLevel(zoomLevel) {
    this.zoomLevel = zoomLevel;
    this.updateScale();
    this.coordinateCache.clear();
  }

  /**
   * 현재 중심점 반환
   */
  getCenter() {
    return [...this.centerLngLat];
  }

  /**
   * 현재 줌 레벨 반환
   */
  getZoomLevel() {
    return this.zoomLevel;
  }

  /**
   * 캐시 크기 반환 (디버깅용)
   */
  getCacheSize() {
    return this.coordinateCache.size;
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.coordinateCache.clear();
  }
}

/**
 * Haversine 거리 계산 (미터)
 */
export function calculateDistance(from, to) {
  const R = 6371000; // 지구 반지름 (미터)
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const deltaLat = ((to[1] - from[1]) * Math.PI) / 180;
  const deltaLng = ((to[0] - from[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.asin(Math.sqrt(a));

  return R * c;
}

/**
 * 베어링(방향) 계산 (라디안, 0 = 북쪽)
 */
export function calculateBearing(from, to) {
  const lat1 = (from[1] * Math.PI) / 180;
  const lat2 = (to[1] * Math.PI) / 180;
  const deltaLng = ((to[0] - from[0]) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = Math.atan2(y, x);
  return bearing; // 라디안 (-π ~ π)
}

/**
 * 점과 선분 사이의 최단 거리 및 가장 가까운 점 반환
 */
export function getClosestPointOnSegment(point, segmentStart, segmentEnd) {
  const v = {
    x: segmentEnd.x - segmentStart.x,
    y: segmentEnd.y - segmentStart.y,
    z: segmentEnd.z - segmentStart.z
  };
  const w = {
    x: point.x - segmentStart.x,
    y: point.y - segmentStart.y,
    z: point.z - segmentStart.z
  };

  const dotVV = v.x * v.x + v.y * v.y + v.z * v.z;
  const dotVW = v.x * w.x + v.y * w.y + v.z * w.z;

  let t = Math.max(0, Math.min(1, dotVW / dotVV));
  
  const closestPoint = {
    x: segmentStart.x + v.x * t,
    y: segmentStart.y + v.y * t,
    z: segmentStart.z + v.z * t
  };

  const dx = point.x - closestPoint.x;
  const dy = point.y - closestPoint.y;
  const dz = point.z - closestPoint.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return { closestPoint, t, distance };
}

/**
 * 배치 좌표 변환 (성능 최적화)
 */
export function batchConvertCoordinates(coordinateSystem, lngLatArray, elevations = []) {
  return lngLatArray.map((lngLat, index) => {
    const elevation = elevations[index] || 0;
    return coordinateSystem.lngLatToWorld(lngLat, elevation);
  });
}

/**
 * 각도 정규화 (-π ~ π)
 */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * 각도 차이 계산 (최단 거리)
 */
export function angleDifference(from, to) {
  let diff = to - from;
  return normalizeAngle(diff);
}
