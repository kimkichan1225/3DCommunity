package com.community.repository;

import com.community.model.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {

    Optional<PaymentHistory> findByOrderId(String orderId);

    Optional<PaymentHistory> findByPaymentKey(String paymentKey);

    List<PaymentHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PaymentHistory> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PaymentHistory.PaymentStatus status);

    boolean existsByOrderId(String orderId);
}
