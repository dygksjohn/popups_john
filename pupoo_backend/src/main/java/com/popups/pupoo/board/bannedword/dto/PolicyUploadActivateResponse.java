package com.popups.pupoo.board.bannedword.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PolicyUploadActivateResponse {
    private String status;
    private String activeCollection;
    private String activeFilename;
    private Integer chunkCount;
    private Integer embeddingDim;
}

