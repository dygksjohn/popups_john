// file: src/main/java/com/popups/pupoo/common/api/MessageResponse.java
package com.popups.pupoo.common.api;

/**
 * 공통 메시지 응답 DTO.
 * - 성공 처리 후 단순 안내 메시지를 반환할 때 사용한다.
 */
public record MessageResponse(String message) {
}
