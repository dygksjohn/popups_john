// file: com/popups/pupoo/storage/application/StorageAdminService.java
package com.popups.pupoo.storage.application;

/**
 * 관리자 전용 유스케이스 확장 포인트.
 *
 * 현재 v1.0에서는 AdminController가 Repository를 직접 호출하거나,
 * 도메인 Service(사용자용)를 재사용하는 형태가 섞여 있다.
 *
 * 운영 안정(v2)에서는 관리자 유스케이스를 이 클래스로 모아서
 * 권한/감사로그/검색 조건을 일관되게 적용한다.
 */
@Deprecated
public class StorageAdminService {

    private StorageAdminService() {
        // v1.0 단계에서는 미사용(확장 포인트) 클래스다.
    }
}
