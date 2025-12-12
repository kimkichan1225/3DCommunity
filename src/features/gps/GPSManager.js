/**
 * GPS/위치 서비스 관리자
 * Geolocation API, 위치 업데이트
 */

export class GPSManager {
  constructor() {
    this.lastGPS = null;
    this.isWatching = false;
    this.watchId = null;
    this.onLocationUpdate = null; // 콜백
    this.updateInterval = 1000; // 1초마다
    this.lastUpdateTime = 0;
  }

  /**
   * GPS 감시 시작
   */
  start() {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported');
      // 테스트용 더미 위치
      this.simulateLocation();
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionSuccess(position),
      (error) => this.handlePositionError(error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000, // 5초 캐시
        timeout: 10000, // 10초 타임아웃
      }
    );

    this.isWatching = true;
    console.log('✅ GPS watching started');
  }

  /**
   * GPS 감시 중지
   */
  stop() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.isWatching = false;
      console.log('🛑 GPS watching stopped');
    }
  }

  /**
   * 위치 업데이트 성공
   */
  handlePositionSuccess(position) {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.updateInterval) {
      return; // 너무 자주 업데이트하지 않기
    }

    const gps = {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
      accuracy: position.coords.accuracy, // 오차 범위 (m)
      altitude: position.coords.altitude, // 고도
    };

    this.lastGPS = gps;
    this.lastUpdateTime = now;

    console.log(
      `📍 GPS Updated: Lng=${gps.lng.toFixed(6)}, Lat=${gps.lat.toFixed(6)}, Accuracy=${gps.accuracy.toFixed(1)}m`
    );

    // 콜백 실행
    if (this.onLocationUpdate) {
      this.onLocationUpdate(gps);
    }
  }

  /**
   * 위치 업데이트 실패
   */
  handlePositionError(error) {
    console.error('❌ GPS Error:', error.message);

    // 에러 케이스별 처리
    switch (error.code) {
      case 1:
        console.warn('사용자가 위치 공유 거부');
        break;
      case 2:
        console.warn('위치 정보를 사용할 수 없음');
        break;
      case 3:
        console.warn('위치 요청 타임아웃');
        break;
    }

    // 테스트용 더미 위치 사용
    this.simulateLocation();
  }

  /**
   * 테스트용 위치 시뮬레이션
   * 강남역을 기준으로 작은 원 안에서 움직임
   */
  simulateLocation() {
    const baseGPS = {
      lng: 127.0276,
      lat: 37.4979,
    };

    const now = Date.now();
    const angle = (now / 5000) * Math.PI * 2; // 5초마다 회전
    const radius = 0.0002; // 약 20m

    const simGPS = {
      lng: baseGPS.lng + radius * Math.cos(angle),
      lat: baseGPS.lat + radius * Math.sin(angle),
      accuracy: 10,
      altitude: 0,
    };

    if (!this.lastGPS || Date.now() - this.lastUpdateTime > this.updateInterval) {
      this.lastGPS = simGPS;
      this.lastUpdateTime = Date.now();

      if (this.onLocationUpdate) {
        this.onLocationUpdate(simGPS);
      }
    }
  }

  /**
   * 현재 GPS 위치 반환
   */
  getLastGPS() {
    return this.lastGPS;
  }

  /**
   * GPS 시뮬레이션 활성화/비활성화
   */
  setSimulationMode(enabled) {
    if (enabled) {
      this.stop();
      // 주기적으로 시뮬레이션 업데이트
      this.simulationInterval = setInterval(() => {
        this.simulateLocation();
      }, this.updateInterval);
    } else {
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
      }
      this.start();
    }
  }
}
