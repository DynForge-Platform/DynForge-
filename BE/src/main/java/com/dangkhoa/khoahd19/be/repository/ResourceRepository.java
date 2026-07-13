package com.dangkhoa.khoahd19.be.repository;

import com.dangkhoa.khoahd19.be.model.entity.Resource;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResourceRepository extends MongoRepository<Resource, String> {
}
