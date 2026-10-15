package com.cetsheet.backend.Repository;

import com.cetsheet.backend.Model.ResourceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

public interface ResourceFileRepository extends JpaRepository<ResourceFile, Integer> {
    @Query("select resourceFile.resourceId from ResourceFile resourceFile where resourceFile.resourceId in :resourceIds")
    Set<Integer> findExistingResourceIds(@Param("resourceIds") Collection<Integer> resourceIds);
}
