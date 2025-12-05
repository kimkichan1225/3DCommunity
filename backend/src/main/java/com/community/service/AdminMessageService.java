package com.community.service;

import com.community.dto.ChatLogDto;
import com.community.model.Message;
import com.community.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminMessageService {

    private final MessageRepository messageRepository;

    /**
     * 전체 채팅 로그 조회 (페이지네이션)
     */
    public Page<ChatLogDto> getAllChatLogs(Pageable pageable) {
        Page<Message> messages = messageRepository.findAllByOrderByCreatedAtDesc(pageable);
        return messages.map(ChatLogDto::fromEntity);
    }

    /**
     * 메시지 타입별 조회 (PLAZA, DM, LOCAL_ROOM)
     */
    public Page<ChatLogDto> getChatLogsByType(String messageType, Pageable pageable) {
        Message.MessageType type = Message.MessageType.valueOf(messageType);
        Page<Message> messages = messageRepository.findByMessageTypeOrderByCreatedAtDesc(type, pageable);
        return messages.map(ChatLogDto::fromEntity);
    }

    /**
     * 특정 사용자가 보낸 메시지 조회
     */
    public Page<ChatLogDto> getChatLogsByUser(Long userId, Pageable pageable) {
        Page<Message> messages = messageRepository.findBySenderId(userId, pageable);
        return messages.map(ChatLogDto::fromEntity);
    }

    /**
     * 키워드로 메시지 검색
     */
    public Page<ChatLogDto> searchChatLogs(String keyword, Pageable pageable) {
        Page<Message> messages = messageRepository.findByContentContaining(keyword, pageable);
        return messages.map(ChatLogDto::fromEntity);
    }

    /**
     * 메시지 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteMessage(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다."));
        message.setIsDeleted(true);
        messageRepository.save(message);
        log.info("메시지 삭제 (소프트): messageId={}", messageId);
    }

    /**
     * 메시지 복구
     */
    @Transactional
    public void restoreMessage(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("메시지를 찾을 수 없습니다."));
        message.setIsDeleted(false);
        messageRepository.save(message);
        log.info("메시지 복구: messageId={}", messageId);
    }

    /**
     * 메시지 영구 삭제
     */
    @Transactional
    public void permanentlyDeleteMessage(Long messageId) {
        messageRepository.deleteById(messageId);
        log.info("메시지 영구 삭제: messageId={}", messageId);
    }

    /**
     * 7일 이상 된 메시지 자동 삭제 (매일 새벽 3시 실행)
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void deleteOldMessages() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        long beforeCount = messageRepository.count();

        messageRepository.deleteByCreatedAtBefore(cutoffDate);

        long afterCount = messageRepository.count();
        long deletedCount = beforeCount - afterCount;

        log.info("7일 이상 된 메시지 자동 삭제 완료: {}개 삭제됨 (기준일: {})", deletedCount, cutoffDate);
    }

    /**
     * 수동으로 오래된 메시지 삭제 (관리자 요청 시)
     */
    @Transactional
    public long deleteOldMessagesManually() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7);
        long beforeCount = messageRepository.count();

        messageRepository.deleteByCreatedAtBefore(cutoffDate);

        long afterCount = messageRepository.count();
        long deletedCount = beforeCount - afterCount;

        log.info("수동 메시지 삭제 완료: {}개 삭제됨 (기준일: {})", deletedCount, cutoffDate);
        return deletedCount;
    }
}
