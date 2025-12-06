package com.community.service;

import com.community.model.User;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
}
