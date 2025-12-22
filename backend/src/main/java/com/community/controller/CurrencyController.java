package com.community.controller;

import com.community.model.User;
import com.community.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * CurrencyController
 * - 재화 관련 API 엔드포인트
 * - GET /api/currency: 재화 조회
 * - POST /api/currency/silver/add: Silver Coin 추가
 * - POST /api/currency/gold/add: Gold Coin 추가
 * - POST /api/currency/silver/subtract: Silver Coin 차감
 * - POST /api/currency/gold/subtract: Gold Coin 차감
 */
@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    /**
     * 현재 사용자의 재화 정보 조회
     */
    @GetMapping
    public ResponseEntity<?> getCurrency(@AuthenticationPrincipal User user) {
        try {
            Map<String, Integer> currency = currencyService.getUserCurrency(user.getId());
            return ResponseEntity.ok(currency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Silver Coin 추가
     */
    @PostMapping("/silver/add")
    public ResponseEntity<?> addSilverCoins(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer amount = request.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            Map<String, Integer> currency = currencyService.addSilverCoins(user.getId(), amount);
            return ResponseEntity.ok(currency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Gold Coin 추가
     */
    @PostMapping("/gold/add")
    public ResponseEntity<?> addGoldCoins(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer amount = request.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            Map<String, Integer> currency = currencyService.addGoldCoins(user.getId(), amount);
            return ResponseEntity.ok(currency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Silver Coin 차감
     */
    @PostMapping("/silver/subtract")
    public ResponseEntity<?> subtractSilverCoins(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer amount = request.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            Map<String, Integer> currency = currencyService.subtractSilverCoins(user.getId(), amount);
            return ResponseEntity.ok(currency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Gold Coin 차감
     */
    @PostMapping("/gold/subtract")
    public ResponseEntity<?> subtractGoldCoins(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer amount = request.get("amount");
            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            Map<String, Integer> currency = currencyService.subtractGoldCoins(user.getId(), amount);
            return ResponseEntity.ok(currency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
    /**
     * Gold Coin을 Silver Coin으로 교환 (1:100)
     */
    @PostMapping("/exchange/gold-to-silver")
    public ResponseEntity<?> exchangeGoldToSilver(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer goldAmount = request.get("goldAmount");
            if (goldAmount == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "goldAmount is required"));
            }
            Map<String, Integer> currency = currencyService.exchangeGoldToSilver(user.getId(), goldAmount);
            return ResponseEntity.ok(currency);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
