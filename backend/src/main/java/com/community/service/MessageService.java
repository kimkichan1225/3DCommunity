package com.community.service;

import com.community.dto.MessageDto;
import com.community.model.Friendship;
import com.community.model.Message;
import com.community.model.User;
import com.community.repository.FriendshipRepository;
import com.community.repository.MessageRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final ActiveUserService activeUserService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * DM 전송
     */
    @Transactional
    public MessageDto sendDM(Long senderId, Long receiverId, String content) {
        // 송신자 조회
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("송신자를 찾을 수 없습니다."));

        // 수신자 조회
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("수신자를 찾을 수 없습니다."));

        // 친구 관계 확인
        Optional<Friendship> friendship = friendshipRepository.findByUserIds(senderId, receiverId);
        if (friendship.isEmpty() || friendship.get().getStatus() != Friendship.FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("친구가 아닌 사용자에게는 메시지를 보낼 수 없습니다.");
        }

        // 메시지 생성
        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .messageType(Message.MessageType.DM)
                .build();

        message = messageRepository.save(message);

        // WebSocket 알림: 수신자에게 새 메시지 알림
        MessageDto messageDto = MessageDto.fromEntity(message);
        messagingTemplate.convertAndSend("/topic/dm/" + receiverId, messageDto);

        return messageDto;
    }

    /**
     * 특정 사용자와의 DM 내역 조회
     */
    public List<MessageDto> getDMHistory(Long userId, Long friendId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Message> messages = messageRepository.findDMBetweenUsers(userId, friendId, pageable);

        // 최신순으로 반환되므로 역순으로 정렬 (오래된 것부터)
        Collections.reverse(messages);

        return messages.stream()
                .map(MessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * DM 대화 목록 조회 (채팅방 목록)
     */
    public List<MessageDto> getConversations(Long userId) {
        // 1. 친구 목록 조회
        List<Friendship> friendships = friendshipRepository.findFriendsByUserIdAndStatus(
                userId,
                Friendship.FriendshipStatus.ACCEPTED
        );

        // 2. 각 친구와의 마지막 메시지 조회
        List<MessageDto> conversations = new ArrayList<>();

        for (Friendship friendship : friendships) {
            User friend = friendship.getRequester().getId().equals(userId)
                    ? friendship.getAddressee()
                    : friendship.getRequester();

            // 마지막 메시지 조회
            Pageable pageable = PageRequest.of(0, 1);
            List<Message> lastMessages = messageRepository.findDMBetweenUsers(userId, friend.getId(), pageable);

            Message lastMessage = lastMessages.isEmpty() ? null : lastMessages.get(0);

            // 안 읽은 메시지 개수 (TODO: 읽음 처리 기능 구현 후 실제 개수 계산)
            int unreadCount = 0;

            // 친구 온라인 여부
            boolean isOnline = activeUserService.isUserActive(friend.getId().toString());

            // 대화 정보 생성
            MessageDto conversation = MessageDto.forConversation(friend, lastMessage, unreadCount, isOnline);
            conversations.add(conversation);
        }

        // 마지막 메시지 시간 기준으로 정렬 (최신순)
        conversations.sort((a, b) -> {
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return conversations;
    }
}
