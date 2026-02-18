// src/main/java/com/popups/pupoo/pet/application/PetServiceImpl.java
package com.popups.pupoo.pet.application;

import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.pet.domain.model.Pet;
import com.popups.pupoo.pet.dto.PetCreateRequest;
import com.popups.pupoo.pet.dto.PetMeResponse;
import com.popups.pupoo.pet.dto.PetResponse;
import com.popups.pupoo.pet.dto.PetUpdateRequest;
import com.popups.pupoo.pet.persistence.PetRepository;
import com.popups.pupoo.user.persistence.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

/**
 * Pet 도메인 비즈니스 로직 구현
 * - 수정/삭제는 소유권 검증 포함
 * - 내 펫 조회는 (공개설정 반영): users.show_pet=false면 빈 리스트 반환
 */
@Service
@Transactional
public class PetServiceImpl implements PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    public PetServiceImpl(PetRepository petRepository, UserRepository userRepository) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Long create(Long userId, PetCreateRequest request) {
        Pet pet = new Pet(
                userId,
                request.petName(),
                request.petBreed(),
                request.petAge()
        );
        return petRepository.save(pet).getPetId();
    }

    @Override
    public void update(Long userId, Long petId, PetUpdateRequest request) {
        Pet pet = petRepository.findByPetIdAndUserId(petId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));

        pet.update(
                request.petName(),
                request.petBreed(),
                request.petAge()
        );
    }

    @Override
    public void delete(Long userId, Long petId) {
        Pet pet = petRepository.findByPetIdAndUserId(petId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));

        petRepository.delete(pet);
    }

    @Override
    @Transactional(readOnly = true)
    public PetMeResponse getMe(Long userId) {
        // ✅ 공개설정(show_pet) 반영
        Boolean showPet = userRepository.findShowPetByUserId(userId);

        // user row가 없거나(비정상) show_pet=false면 빈 리스트 반환
        if (showPet == null || !showPet) {
            return new PetMeResponse(Collections.emptyList());
        }

        List<PetResponse> pets = petRepository.findAllByUserIdOrderByPetIdDesc(userId).stream()
                .map(PetResponse::from)
                .toList();

        return new PetMeResponse(pets);
    }
}
