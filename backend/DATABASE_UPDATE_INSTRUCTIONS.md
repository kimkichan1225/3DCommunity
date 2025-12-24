# 데이터베이스 modelUrl 업데이트 방법

## 문제
데이터베이스의 `shop_items` 테이블에 `model_url` 값이 `null`로 저장되어 있어서 캐릭터 모델이 변경되지 않습니다.

## 해결 방법

### 옵션 1: H2 콘솔에서 SQL 실행 (권장)

1. **H2 콘솔 접속**
   - 브라우저에서 http://localhost:8080/h2-console 열기
   - JDBC URL: `jdbc:h2:mem:testdb`
   - Username: `sa`
   - Password: (비어있음)
   - Connect 클릭

2. **SQL 스크립트 실행**
   - `update_model_urls.sql` 파일 내용 복사
   - H2 콘솔의 SQL 입력창에 붙여넣기
   - Run 클릭

3. **확인**
   - 마지막 SELECT 쿼리 결과에서 `model_url` 컬럼에 값이 있는지 확인

### 옵션 2: REST API로 아이템 재등록

아이템을 생성할 때 `modelUrl` 필드를 포함하도록 수정:

```json
{
  "name": "Cow",
  "description": "소 동물 캐릭터",
  "categoryId": 1,
  "price": 1500,
  "imageUrl": "/resources/Icon/Cow-icon.png",
  "modelUrl": "/resources/Ultimate Animated Character Pack - Nov 2019/glTF/Cow.gltf",
  "itemType": "AVATAR",
  "isActive": true
}
```

## 테스트

업데이트 후:
1. 프론트엔드 새로고침 (F5)
2. 상점 열기
3. 아바타 착용하기
4. 콘솔에서 `🟢 [8] 모델 경로 변경` 로그 확인
5. 캐릭터 외형이 변경되는지 확인

## 참고

- H2는 인메모리 데이터베이스이므로 서버 재시작 시 데이터가 초기화됩니다
- 영구적인 해결을 위해서는 `application.properties`에서 파일 기반 H2로 변경하거나
- 초기 데이터 로딩 스크립트(`data.sql`)에 modelUrl을 포함해야 합니다
