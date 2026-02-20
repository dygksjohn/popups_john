// src/main/java/com/popups/pupoo/user/social/application/SocialAccountService.java
package com.popups.pupoo.user.social.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.user.social.domain.enums.SocialProvider;
import com.popups.pupoo.user.social.domain.model.SocialAccount;
import com.popups.pupoo.user.social.dto.SocialAccountResponse;
import com.popups.pupoo.user.social.dto.SocialLinkRequest;
import com.popups.pupoo.user.social.dto.SocialUnlinkRequest;
import com.popups.pupoo.user.social.persistence.SocialAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SocialAccountService {

    private final SocialAccountRepository socialAccountRepository;

    public SocialAccountService(SocialAccountRepository socialAccountRepository) {
        this.socialAccountRepository = socialAccountRepository;
    }

    /**
     * ✅ 내 소셜 계정 목록 조회
     *
     * Repository에 아래 메서드가 필요:
     *   List<SocialAccount> findAllByUserId(Long userId);
     */
    @Transactional(readOnly = true)
    public List<SocialAccountResponse> getMySocialAccounts(Long userId) {
        return socialAccountRepository.findAllByUserId(userId)
                .stream()
                .map(SocialAccountResponse::from)
                .toList();
    }

    /**
     * ✅ 소셜 계정 연동(원본 메서드)
     */
    @Transactional
    public SocialAccountResponse createMySocialAccount(Long userId, SocialLinkRequest request) {
        SocialProvider provider = SocialProvider.from(request.getProvider());
        String providerUid = request.getProviderUid().trim();

        if (socialAccountRepository.existsByUserIdAndProvider(userId, provider)) {
            throw new BusinessException(ErrorCode.SOCIAL_ACCOUNT_DUPLICATE_PROVIDER);
        }

        socialAccountRepository.findByProviderAndProviderUid(provider, providerUid).ifPresent(existing -> {
            if (existing.getUserId().equals(userId)) {
                throw new BusinessException(ErrorCode.SOCIAL_ACCOUNT_DUPLICATE_PROVIDER_UID);
            }
            throw new BusinessException(ErrorCode.SOCIAL_ACCOUNT_PROVIDER_UID_CONFLICT);
        });

        SocialAccount saved = socialAccountRepository.save(new SocialAccount(userId, provider, providerUid));
        return SocialAccountResponse.from(saved);
    }

    /**
     * ✅ 소셜 계정 해제(원본 메서드)
     */
    @Transactional
    public void unlinkByProvider(Long userId, String providerValue) {
        SocialProvider provider = SocialProvider.from(providerValue);
        SocialAccount socialAccount = socialAccountRepository.findByUserIdAndProvider(userId, provider)
                .orElseThrow(() -> new BusinessException(ErrorCode.SOCIAL_ACCOUNT_NOT_FOUND));
        socialAccountRepository.delete(socialAccount);
    }

    /* =========================================================
     * ✅ 컨트롤러/기존 코드 호환용 alias 메서드
     * ========================================================= */

    /**
     * 컨트롤러에서 link(userId, request)로 호출하는 경우 호환.
     */
    @Transactional
    public SocialAccountResponse link(Long userId, SocialLinkRequest request) {
        return createMySocialAccount(userId, request);
    }

    /**
     * 컨트롤러에서 unlink(userId, request)로 호출하는 경우 호환.
     */
    @Transactional
    public void unlink(Long userId, SocialUnlinkRequest request) {
        unlinkByProvider(userId, request.getProvider());
    }
}
