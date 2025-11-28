package com.community.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_profile_items",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "profile_item_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_item_id", nullable = false)
    private ProfileItem profileItem;

    @Column(nullable = false, updatable = false)
    private LocalDateTime unlockedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (unlockedAt == null) {
            unlockedAt = LocalDateTime.now();
        }
    }
}
