// src/main/java/com/popups/pupoo/user/dto/UserUpdateRequest.java
package com.popups.pupoo.user.dto;

public class UserUpdateRequest {

    private String nickname;
    private String phone;

    // ✅ boolean 유지
    private boolean showAge;
    private boolean showGender;
    private boolean showPet;

    public UserUpdateRequest() {}

    public String getNickname() { return nickname; }
    public String getPhone() { return phone; }

    public boolean isShowAge() { return showAge; }
    public boolean isShowGender() { return showGender; }
    public boolean isShowPet() { return showPet; }

    public void setNickname(String nickname) { this.nickname = nickname; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setShowAge(boolean showAge) { this.showAge = showAge; }
    public void setShowGender(boolean showGender) { this.showGender = showGender; }
    public void setShowPet(boolean showPet) { this.showPet = showPet; }
}
