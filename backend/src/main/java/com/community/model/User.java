package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role = Role.ROLE_USER;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 제재 관련 필드
    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil; // 제재 종료 시간 (null이면 제재 없음)

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason; // 제재 사유

    @Column(name = "is_permanently_suspended")
    private Boolean isPermanentlySuspended = false; // 영구 정지 여부

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt; // 마지막 로그인 시간

    // 선택된 프로필 이미지
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "selected_profile_id")
    private ProfileItem selectedProfile;

    // 선택된 프로필 테두리
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "selected_outline_id")
    private ProfileItem selectedOutline;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // UserDetails 인터페이스 구현
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        // UserDetails의 getUsername()은 로그인에 사용되는 고유 식별자를 반환해야 함
        // 이 프로젝트에서는 email을 로그인 ID로 사용하므로 email을 반환
        return email;
    }

    // 실제 닉네임을 가져오는 메서드
    public String getNickname() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // 영구 정지된 경우 또는 제재 기간이 남아있는 경우 계정 잠금
        if (isPermanentlySuspended != null && isPermanentlySuspended) {
            return false;
        }
        if (suspendedUntil != null && suspendedUntil.isAfter(LocalDateTime.now())) {
            return false;
        }
        return true;
    }

    /**
     * 현재 제재 중인지 확인
     */
    public boolean isSuspended() {
        if (isPermanentlySuspended != null && isPermanentlySuspended) {
            return true;
        }
        return suspendedUntil != null && suspendedUntil.isAfter(LocalDateTime.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
