// file: src/main/java/com/popups/pupoo/storage/application/StoragePurgeScheduler.java
package com.popups.pupoo.storage.application;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 지연삭제 스케줄러
 * - soft delete 된 파일 중, retention 기간이 지난 오브젝트를 실제 스토리지에서 제거한다.
 */
@Component
public class StoragePurgeScheduler {

    private static final int RETENTION_DAYS = 7;

    private final StorageService storageService;

    public StoragePurgeScheduler(StorageService storageService) {
        this.storageService = storageService;
    }

    /**
     * 매일 03:10 실행
     */
    @Scheduled(cron = "0 10 3 * * *")
    public void purge() {
        storageService.purgeDeletedObjects(RETENTION_DAYS);
    }
}
