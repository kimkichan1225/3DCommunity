package com.community.repository;

import com.community.model.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    Optional<Board> findByName(String name);

    Optional<Board> findByCategory(Board.BoardCategory category);

    Boolean existsByName(String name);
}
