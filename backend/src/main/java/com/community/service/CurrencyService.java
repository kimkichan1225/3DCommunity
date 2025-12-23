package com.community.service;

import com.community.model.User;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * CurrencyService
 * - 사용자 재화 관리 서비스
 * - Silver Coin (일반 재화), Gold Coin (유료 재화) 처리
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CurrencyService {

    private final UserRepository userRepository;

    /**
     * 사용자의 재화 정보 조회
     */
    public Map<String, Integer> getUserCurrency(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }

    /**
     * Silver Coin 추가
     */
    @Transactional
    public Map<String, Integer> addSilverCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setSilverCoins(user.getSilverCoins() + amount);
        userRepository.save(user);

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }

    /**
     * Gold Coin 추가
     */
    @Transactional
    public Map<String, Integer> addGoldCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setGoldCoins(user.getGoldCoins() + amount);
        userRepository.save(user);

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }

    /**
     * Silver Coin 차감
     */
    @Transactional
    public Map<String, Integer> subtractSilverCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getSilverCoins() < amount) {
            throw new IllegalArgumentException("Insufficient silver coins");
        }

        user.setSilverCoins(user.getSilverCoins() - amount);
        userRepository.save(user);

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }

    /**
     * Gold Coin 차감
     */
    @Transactional
    public Map<String, Integer> subtractGoldCoins(Long userId, Integer amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGoldCoins() < amount) {
            throw new IllegalArgumentException("Insufficient gold coins");
        }

        user.setGoldCoins(user.getGoldCoins() - amount);
        userRepository.save(user);

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }
    /**
     * Gold Coin을 Silver Coin으로 교환 (1 Gold = 100 Silver)
     */
    @Transactional
    public Map<String, Integer> exchangeGoldToSilver(Long userId, Integer goldAmount) {
        if (goldAmount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGoldCoins() < goldAmount) {
            throw new IllegalArgumentException("Insufficient gold coins for exchange");
        }

        // 금화 차감 및 은화 추가 (1:100 비율)
        int silverToAdd = goldAmount * 100;
        user.setGoldCoins(user.getGoldCoins() - goldAmount);
        user.setSilverCoins(user.getSilverCoins() + silverToAdd);
        
        userRepository.save(user);

        log.info("[CurrencyService] 재화 교환 완료: userId={}, goldSpent={}, silverGained={}", 
            userId, goldAmount, silverToAdd);

        Map<String, Integer> currency = new HashMap<>();
        currency.put("silverCoins", user.getSilverCoins());
        currency.put("goldCoins", user.getGoldCoins());
        return currency;
    }
}
