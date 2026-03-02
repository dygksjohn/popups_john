// file: src/main/java/com/popups/pupoo/program/apply/dto/ProgramApplyRequest.java
package com.popups.pupoo.program.apply.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProgramApplyRequest {
    private Long programId;

    /**
     * 신청에 사용된 반려동물 ID (nullable).
     * 사용자가 여러 반려동물을 등록한 경우 특정 반려동물을 선택하여 신청할 수 있다.
     */
    private Long petId;
}
