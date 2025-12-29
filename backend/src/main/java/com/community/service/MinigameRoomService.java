package com.community.service;

import com.community.dto.MinigamePlayerDto;
import com.community.dto.MinigameRoomDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import com.community.dto.GameEventDto;
import com.community.dto.GameTargetDto;
import com.community.dto.GameScoreDto;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class MinigameRoomService {

    private final Map<String, MinigameRoomDto> rooms = new ConcurrentHashMap<>();

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    // Game sessions per room
    private final Map<String, GameSession> sessions = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final Random random = new Random();

    // Reaction round state
    private final Map<String, Boolean> reactionActive = new ConcurrentHashMap<>();
    private final Map<String, String> reactionWinner = new ConcurrentHashMap<>();

    /**
     * 방 생성
     */
    public MinigameRoomDto createRoom(String roomName, String gameName, String hostId, String hostName,
                                       int maxPlayers, boolean isLocked, int hostLevel,
                                       String selectedProfile, String selectedOutline) {
        String roomId = UUID.randomUUID().toString();

        MinigameRoomDto room = new MinigameRoomDto();
        room.setRoomId(roomId);
        room.setRoomName(roomName);
        room.setGameName(gameName);
        room.setHostId(hostId);
        room.setHostName(hostName);
        room.setMaxPlayers(maxPlayers);
        room.setLocked(isLocked);
        room.setPlaying(false);
        room.setCurrentPlayers(1);

        MinigamePlayerDto host = new MinigamePlayerDto();
        host.setUserId(hostId);
        host.setUsername(hostName);
        host.setLevel(hostLevel);
        host.setHost(true);
        host.setReady(true);
        host.setSelectedProfile(selectedProfile);
        host.setSelectedOutline(selectedOutline);

        room.getPlayers().add(host);
        rooms.put(roomId, room);

        log.info("방 생성: {} (ID: {})", roomName, roomId);
        return room;
    }

    /**
     * 방 목록 조회
     */
    public List<MinigameRoomDto> getAllRooms() {
        return new ArrayList<>(rooms.values());
    }

    /**
     * 방 조회
     */
    public MinigameRoomDto getRoom(String roomId) {
        return rooms.get(roomId);
    }

    /**
     * 방 입장
     */
    public MinigameRoomDto joinRoom(String roomId, MinigamePlayerDto player) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            log.error("방을 찾을 수 없습니다: {}", roomId);
            return null;
        }

        // If already in room, return existing room without changing counts
        boolean alreadyIn = room.getPlayers().stream().anyMatch(p -> p.getUserId().equals(player.getUserId()));
        if (alreadyIn) {
            log.info("플레이어 {}는 이미 방에 있습니다: {}", player.getUsername(), roomId);
            return room;
        }

        log.info("방 상태 before join - roomId: {}, currentPlayers: {}, maxPlayers: {}, players: {}",
                roomId, room.getCurrentPlayers(), room.getMaxPlayers(),
                room.getPlayers().stream().map(p->p.getUserId()).toList());

        if (room.getCurrentPlayers() >= room.getMaxPlayers()) {
            log.warn("방이 가득 찼습니다: {} (현재 {}/{})", roomId, room.getCurrentPlayers(), room.getMaxPlayers());
            return null;
        }

        room.getPlayers().add(player);
        room.setCurrentPlayers(room.getCurrentPlayers() + 1);

        log.info("플레이어 {} 방 입장: {} (현재 {}/{})", player.getUsername(), roomId, room.getCurrentPlayers(), room.getMaxPlayers());
        return room;
    }

    /**
     * 방 나가기
     */
    public MinigameRoomDto leaveRoom(String roomId, String userId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.getPlayers().removeIf(p -> p.getUserId().equals(userId));
        room.setCurrentPlayers(room.getPlayers().size());

        // 방장이 나갔을 때
        if (room.getHostId().equals(userId)) {
            if (room.getPlayers().isEmpty()) {
                // 방 삭제
                rooms.remove(roomId);
                log.info("방 삭제: {}", roomId);
                return null;
            } else {
                // 다음 사람을 방장으로 지정
                MinigamePlayerDto newHost = room.getPlayers().get(0);
                newHost.setHost(true);
                room.setHostId(newHost.getUserId());
                room.setHostName(newHost.getUsername());
                log.info("새로운 방장: {}", newHost.getUsername());
            }
        }

        log.info("플레이어 {} 방 나가기: {}", userId, roomId);
        return room;
    }

    /**
     * 방 설정 변경
     */
    public MinigameRoomDto updateRoomSettings(String roomId, String gameName, int maxPlayers) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.setGameName(gameName);
        room.setMaxPlayers(maxPlayers);

        log.info("방 설정 변경: {} - 게임: {}, 최대 인원: {}", roomId, gameName, maxPlayers);
        return room;
    }

    /**
     * 준비 상태 변경
     */
    public MinigameRoomDto toggleReady(String roomId, String userId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.getPlayers().stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .ifPresent(p -> p.setReady(!p.isReady()));

        return room;
    }

    // Inner class to hold session state
    private static class GameSession {
        private final String roomId;
        Map<String, GameTargetDto> activeTargets = new ConcurrentHashMap<>();
        Map<String, Integer> scores = new ConcurrentHashMap<>();
        java.util.concurrent.ScheduledFuture<?> future;
        private int remainingSeconds = 0;

        public GameSession(String roomId) {
            this.roomId = roomId;
        }

        public int getRemainingSeconds() { return remainingSeconds; }
        public void setRemainingSeconds(int s) { remainingSeconds = s; }
        public void decrementRemainingSeconds() { remainingSeconds--; }
    }

    /**
     * 게임 시작
     */
    public MinigameRoomDto startGame(String roomId) {
        MinigameRoomDto room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        room.setPlaying(true);
        log.info("게임 시작: {}", roomId);

        // Initialize game session
        GameSession session = new GameSession(roomId);
        sessions.put(roomId, session);

        // Broadcast gameStart event
        GameEventDto startEvent = new GameEventDto();
        startEvent.setRoomId(roomId);
        startEvent.setType("gameStart");
        startEvent.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", startEvent);

        // Schedule periodic target spawns and stop after duration (e.g., 20s)
        final int totalDurationSec = 20;
        session.setRemainingSeconds(totalDurationSec);

        session.future = scheduler.scheduleAtFixedRate(() -> {
            try {
                // spawn a target
                spawnTarget(roomId);
                session.decrementRemainingSeconds();
                if (session.getRemainingSeconds() <= 0) {
                    // end game
                    endGameSession(roomId);
                }
            } catch (Exception e) {
                log.error("Error in game scheduler for room {}: {}", roomId, e.getMessage());
            }
        }, 0, 2, TimeUnit.SECONDS); // spawn every 2s

        return room;
    }

    private void spawnTarget(String roomId) {
        GameSession session = sessions.get(roomId);
        if (session == null) return;

        GameTargetDto target = new GameTargetDto();
        target.setId(UUID.randomUUID().toString());
        target.setX(random.nextDouble());
        target.setY(random.nextDouble());
        target.setSize(0.06 + random.nextDouble() * 0.08); // radius normalized
        target.setCreatedAt(System.currentTimeMillis());
        target.setDuration(1500 + random.nextInt(1500)); // ms

        session.activeTargets.put(target.getId(), target);

        GameEventDto evt = new GameEventDto();
        evt.setRoomId(roomId);
        evt.setType("spawnTarget");
        evt.setTarget(target);
        evt.setTimestamp(System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", evt);
    }

    private void endGameSession(String roomId) {
        GameSession session = sessions.remove(roomId);
        if (session == null) return;
        if (session.future != null && !session.future.isCancelled()) {
            session.future.cancel(false);
        }

        // Broadcast final scores
        Map<String, Integer> scores = session.scores;
        GameEventDto evt = new GameEventDto();
        evt.setRoomId(roomId);
        evt.setType("gameEnd");
        evt.setPayload(scores.toString());
        evt.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", evt);

        // reset room playing flag
        MinigameRoomDto room = rooms.get(roomId);
        if (room != null) {
            room.setPlaying(false);
        }
    }

    public synchronized GameScoreDto handleHit(String roomId, String playerId, String playerName, String targetId, long clientTs) {
        GameSession session = sessions.get(roomId);
        GameScoreDto result = new GameScoreDto();
        result.setPlayerId(playerId);
        result.setScore(0);

        if (session == null) return result;

        GameTargetDto target = session.activeTargets.get(targetId);
        if (target == null) return result; // already taken or expired

        long now = System.currentTimeMillis();
        if (now > target.getCreatedAt() + target.getDuration()) {
            // expired
            session.activeTargets.remove(targetId);
            // notify removal
            GameEventDto removed = new GameEventDto();
            removed.setRoomId(roomId);
            removed.setType("targetRemoved");
            removed.setTarget(target);
            removed.setTimestamp(now);
            messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", removed);
            return result;
        }

        // valid hit
        session.activeTargets.remove(targetId);
        int newScore = session.scores.getOrDefault(playerId, 0) + 1;
        session.scores.put(playerId, newScore);
        result.setScore(newScore);

        // broadcast score update and target removed
        GameEventDto scoreEvt = new GameEventDto();
        scoreEvt.setRoomId(roomId);
        scoreEvt.setType("scoreUpdate");
        scoreEvt.setPlayerId(playerId);
        scoreEvt.setPlayerName(playerName);
        scoreEvt.setPayload(String.valueOf(newScore));
        scoreEvt.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", scoreEvt);

        GameEventDto removed = new GameEventDto();
        removed.setRoomId(roomId);
        removed.setType("targetRemoved");
        removed.setTarget(target);
        removed.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", removed);

        return result;
    }

    // --- Reaction Race (MVP) ---
    public void startReactionRound(String roomId) {
        startReactionRound(roomId, false);
    }

    public void startReactionRound(String roomId, boolean immediate) {
        // send prepare
        GameEventDto prepare = new GameEventDto();
        prepare.setRoomId(roomId);
        prepare.setType("reactionPrepare");
        prepare.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", prepare);
        log.info("reactionPrepare sent for room {} (immediate={})", roomId, immediate);

        reactionActive.put(roomId, false);
        reactionWinner.remove(roomId);

        if (immediate) {
            // send GO immediately for testing
            reactionActive.put(roomId, true);
            GameEventDto goImmediate = new GameEventDto();
            goImmediate.setRoomId(roomId);
            goImmediate.setType("reactionGo");
            goImmediate.setTimestamp(System.currentTimeMillis());
            messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", goImmediate);
            log.info("reactionGo (immediate) sent for room {}", roomId);

            // schedule end
            scheduler.schedule(() -> {
                reactionActive.remove(roomId);
                String winner = reactionWinner.get(roomId);
                GameEventDto end = new GameEventDto();
                end.setRoomId(roomId);
                end.setType("reactionEnd");
                end.setPayload(winner == null ? "" : winner);
                end.setTimestamp(System.currentTimeMillis());
                messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", end);
                log.info("reactionEnd sent for room {} (immediate)", roomId);
            }, 3000, TimeUnit.MILLISECONDS);

            return;
        }

        // random delay then send GO
        int delayMs = 800 + random.nextInt(1800); // 800..2600ms
        log.info("Scheduling reactionGo for room {} in {}ms", roomId, delayMs);

        scheduler.schedule(() -> {
            reactionActive.put(roomId, true);
            GameEventDto go = new GameEventDto();
            go.setRoomId(roomId);
            go.setType("reactionGo");
            go.setTimestamp(System.currentTimeMillis());
            messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", go);
            log.info("reactionGo sent for room {}", roomId);

            // set timeout to end reaction round
            scheduler.schedule(() -> {
                reactionActive.remove(roomId);
                String winner = reactionWinner.get(roomId);
                GameEventDto end = new GameEventDto();
                end.setRoomId(roomId);
                end.setType("reactionEnd");
                end.setPayload(winner == null ? "" : winner);
                end.setTimestamp(System.currentTimeMillis());
                messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", end);
                log.info("reactionEnd sent for room {}", roomId);
            }, 3000, TimeUnit.MILLISECONDS); // 3s to respond

        }, delayMs, TimeUnit.MILLISECONDS);
    }

    public synchronized String handleReactionHit(String roomId, String playerId, String playerName, long clientTs) {
        Boolean active = reactionActive.get(roomId);
        if (active == null || !active) return null;
        if (reactionWinner.get(roomId) != null) return null; // already have winner

        reactionWinner.put(roomId, playerName != null ? playerName : playerId);
        reactionActive.remove(roomId);

        GameEventDto res = new GameEventDto();
        res.setRoomId(roomId);
        res.setType("reactionResult");
        res.setPlayerId(playerId);
        res.setPlayerName(playerName);
        res.setTimestamp(System.currentTimeMillis());
        messagingTemplate.convertAndSend("/topic/minigame/room/" + roomId + "/game", res);

        return playerName != null ? playerName : playerId;
    }
}
