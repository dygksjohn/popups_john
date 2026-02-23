운영안정 v2 패치 묶음

목적
- Board/Post/Inquiry 도메인에 대해 'mutating(엔티티 필드 직접 변경)' 방식으로 통일
- 관리자 권한(@PreAuthorize) 적용
- 관리자 강제 삭제(Post) 실제 동작 보장
- JPA dirty checking 안정성(PrePersist/PreUpdate) 보강

관리자 권한
- 표현식: hasAuthority('ROLE_ADMIN')
- 전제: GrantedAuthority에 'ROLE_ADMIN'이 포함되어야 한다.
