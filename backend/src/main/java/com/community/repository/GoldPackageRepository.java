package com.community.repository;

import com.community.model.GoldPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldPackageRepository extends JpaRepository<GoldPackage, Long> {

    List<GoldPackage> findByIsActiveTrueOrderByDisplayOrderAsc();

    List<GoldPackage> findAllByOrderByDisplayOrderAsc();
}
