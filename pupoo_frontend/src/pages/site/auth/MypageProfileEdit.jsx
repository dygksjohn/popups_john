import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import { authApi } from "./api/authApi";
import { userApi } from "../../../features/user/api/userApi";
import { resolveErrorMessage, toFieldMessageMap } from "../../../features/shared/forms/formError";
import {
  mypageCardStyle,
  mypageInputStyle,
  mypageLabelStyle,
  mypageOutlineButtonStyle,
  mypagePageStyle,
  mypagePrimaryButtonStyle,
  mypageTitleStyle,
} from "../../../features/shared/ui/mypageStyles";

export default function MypageProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const [emailVerifyToken, setEmailVerifyToken] = useState("");
  const [emailVerifyInput, setEmailVerifyInput] = useState("");
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailConfirming, setEmailConfirming] = useState(false);

  const [phoneVerifyCode, setPhoneVerifyCode] = useState("");
  const [phoneCodeInput, setPhoneCodeInput] = useState("");
  const [phoneChanging, setPhoneChanging] = useState(false);
  const [phoneConfirming, setPhoneConfirming] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    nickname: "",
    status: "",
    roleName: "",
    createdAt: "",
    lastLoginAt: "",
    lastModifiedAt: "",
    showAge: false,
    showGender: false,
    showPet: false,
    nextEmail: "",
    nextPhone: "",
  });
  const [initialNickname, setInitialNickname] = useState("");

  const nicknameChanged = useMemo(
    () => (form.nickname || "").trim() !== (initialNickname || "").trim(),
    [form.nickname, initialNickname],
  );

  const refreshMe = async () => {
    const me = await mypageApi.getMe();
    setForm((prev) => ({
      ...prev,
      email: me?.email || "",
      phone: me?.phone || "",
      nickname: me?.nickname || "",
      status: me?.status || "",
      roleName: me?.roleName || "",
      createdAt: me?.createdAt || "",
      lastLoginAt: me?.lastLoginAt || "",
      lastModifiedAt: me?.lastModifiedAt || "",
      showAge: Boolean(me?.showAge),
      showGender: Boolean(me?.showGender),
      showPet: Boolean(me?.showPet),
    }));
    setInitialNickname(me?.nickname || "");
    setNicknameChecked(false);
    setNicknameCheckMsg("");
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setGlobalError("");
        const me = await mypageApi.getMe();
        if (!mounted) return;
        setForm({
          email: me?.email || "",
          phone: me?.phone || "",
          nickname: me?.nickname || "",
          status: me?.status || "",
          roleName: me?.roleName || "",
          createdAt: me?.createdAt || "",
          lastLoginAt: me?.lastLoginAt || "",
          lastModifiedAt: me?.lastModifiedAt || "",
          showAge: Boolean(me?.showAge),
          showGender: Boolean(me?.showGender),
          showPet: Boolean(me?.showPet),
          nextEmail: "",
          nextPhone: "",
        });
        setInitialNickname(me?.nickname || "");
      } catch (error) {
        if (!mounted) return;
        setGlobalError(resolveErrorMessage(error, "내 정보를 불러오지 못했습니다."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "nickname") {
      setNicknameChecked(false);
      setNicknameCheckMsg("");
    }
  };

  const checkNickname = async () => {
    const value = (form.nickname || "").trim();
    if (!value) {
      setNicknameChecked(false);
      setNicknameCheckMsg("닉네임을 입력해 주세요.");
      return false;
    }
    if (value === (initialNickname || "").trim()) {
      setNicknameChecked(true);
      setNicknameCheckMsg("현재 닉네임과 동일합니다.");
      return true;
    }

    try {
      const available = await userApi.checkNickname(value);
      const ok = Boolean(available);
      setNicknameChecked(ok);
      setNicknameCheckMsg(ok ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.");
      return ok;
    } catch (error) {
      setNicknameChecked(false);
      setNicknameCheckMsg(resolveErrorMessage(error, "닉네임 중복 확인에 실패했습니다."));
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setGlobalError("");
      setFieldErrors({});

      if (nicknameChanged && !nicknameChecked) {
        const ok = await checkNickname();
        if (!ok) {
          throw new Error("닉네임 중복 확인이 필요합니다.");
        }
      }

      await mypageApi.updateMe({
        nickname: (form.nickname || "").trim(),
        showAge: Boolean(form.showAge),
        showGender: Boolean(form.showGender),
        showPet: Boolean(form.showPet),
      });

      navigate("/mypage");
    } catch (error) {
      setFieldErrors(toFieldMessageMap(error));
      setGlobalError(resolveErrorMessage(error, "프로필 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const requestEmailChange = async () => {
    try {
      setEmailChanging(true);
      setGlobalError("");
      const res = await authApi.requestEmailChange({
        newEmail: (form.nextEmail || "").trim(),
      });
      setEmailVerifyToken(String(res?.devToken || ""));
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "이메일 인증 요청에 실패했습니다."));
    } finally {
      setEmailChanging(false);
    }
  };

  const confirmEmailChange = async () => {
    try {
      setEmailConfirming(true);
      setGlobalError("");
      const token = (emailVerifyInput || emailVerifyToken || "").trim();
      await authApi.confirmEmailChange({ token });
      setEmailVerifyToken("");
      setEmailVerifyInput("");
      setForm((prev) => ({ ...prev, nextEmail: "" }));
      await refreshMe();
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "이메일 변경 확인에 실패했습니다."));
    } finally {
      setEmailConfirming(false);
    }
  };

  const requestPhoneChange = async () => {
    try {
      setPhoneChanging(true);
      setGlobalError("");
      const res = await authApi.requestPhoneChange({
        phone: (form.nextPhone || "").trim(),
      });
      setPhoneVerifyCode(String(res?.devCode || ""));
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "전화번호 인증 요청에 실패했습니다."));
    } finally {
      setPhoneChanging(false);
    }
  };

  const confirmPhoneChange = async () => {
    try {
      setPhoneConfirming(true);
      setGlobalError("");
      const code = (phoneCodeInput || phoneVerifyCode || "").trim();
      await authApi.confirmPhoneChange({
        phone: (form.nextPhone || "").trim(),
        code,
      });
      setPhoneVerifyCode("");
      setPhoneCodeInput("");
      setForm((prev) => ({ ...prev, nextPhone: "" }));
      await refreshMe();
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "전화번호 변경 확인에 실패했습니다."));
    } finally {
      setPhoneConfirming(false);
    }
  };

  return (
    <div style={mypagePageStyle}>
      <div style={{ ...mypageCardStyle, maxWidth: 760, margin: "120px auto 80px" }}>
        <h2 style={mypageTitleStyle}>프로필 수정</h2>
        {globalError ? (
          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{globalError}</div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle} htmlFor="nickname">
              닉네임
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="nickname"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                onBlur={checkNickname}
                style={mypageInputStyle}
                maxLength={30}
                disabled={loading || saving}
              />
              <button
                type="button"
                onClick={checkNickname}
                disabled={loading || saving}
                style={mypageOutlineButtonStyle}
              >
                중복확인
              </button>
            </div>
            {nicknameCheckMsg ? (
              <div style={{ marginTop: 6, color: nicknameChecked ? "#166534" : "#b91c1c", fontSize: 12 }}>
                {nicknameCheckMsg}
              </div>
            ) : null}
            {fieldErrors.nickname ? (
              <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{fieldErrors.nickname}</div>
            ) : null}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>이메일</label>
            <input value={form.email} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>휴대전화</label>
            <input value={form.phone} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>계정 상태</label>
            <input value={form.status} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>권한</label>
            <input value={form.roleName} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>가입일시</label>
            <input value={form.createdAt} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>최근 로그인 일시</label>
            <input value={form.lastLoginAt} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={mypageLabelStyle}>최근 변경 일시</label>
            <input value={form.lastModifiedAt} style={mypageInputStyle} disabled />
          </div>

          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="showAge"
                checked={form.showAge}
                onChange={handleChange}
                disabled={loading || saving}
              />
              나이 공개
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="showGender"
                checked={form.showGender}
                onChange={handleChange}
                disabled={loading || saving}
              />
              성별 공개
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                name="showPet"
                checked={form.showPet}
                onChange={handleChange}
                disabled={loading || saving}
              />
              반려동물 공개
            </label>
          </div>

          <div style={{ marginBottom: 16, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
            현재 프로필 수정 API에서 변경 가능한 항목은 닉네임과 공개설정입니다.
            이메일/전화번호는 아래 인증 절차로 변경할 수 있습니다.
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>이메일 변경 인증</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                name="nextEmail"
                value={form.nextEmail}
                onChange={handleChange}
                placeholder="새 이메일"
                style={mypageInputStyle}
                disabled={emailChanging || emailConfirming}
              />
              <button
                type="button"
                onClick={requestEmailChange}
                disabled={emailChanging || emailConfirming}
                style={mypageOutlineButtonStyle}
              >
                인증요청
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={emailVerifyInput}
                onChange={(e) => setEmailVerifyInput(e.target.value)}
                placeholder="이메일 토큰 입력"
                style={mypageInputStyle}
                disabled={emailChanging || emailConfirming}
              />
              <button
                type="button"
                onClick={confirmEmailChange}
                disabled={emailChanging || emailConfirming}
                style={mypageOutlineButtonStyle}
              >
                변경확인
              </button>
            </div>
            {emailVerifyToken ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#334155" }}>devToken: {emailVerifyToken}</div>
            ) : null}
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>전화번호 변경 인증</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                name="nextPhone"
                value={form.nextPhone}
                onChange={handleChange}
                placeholder="새 전화번호"
                style={mypageInputStyle}
                disabled={phoneChanging || phoneConfirming}
              />
              <button
                type="button"
                onClick={requestPhoneChange}
                disabled={phoneChanging || phoneConfirming}
                style={mypageOutlineButtonStyle}
              >
                인증요청
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={phoneCodeInput}
                onChange={(e) => setPhoneCodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="인증번호 입력"
                style={mypageInputStyle}
                disabled={phoneChanging || phoneConfirming}
              />
              <button
                type="button"
                onClick={confirmPhoneChange}
                disabled={phoneChanging || phoneConfirming}
                style={mypageOutlineButtonStyle}
              >
                변경확인
              </button>
            </div>
            {phoneVerifyCode ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#334155" }}>devCode: {phoneVerifyCode}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading || saving}
              style={{ ...mypagePrimaryButtonStyle, cursor: loading || saving ? "not-allowed" : "pointer" }}
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => navigate("/mypage")}
              disabled={loading || saving}
              style={{ ...mypageOutlineButtonStyle, cursor: loading || saving ? "not-allowed" : "pointer" }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
