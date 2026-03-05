import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import { authApi } from "./api/authApi";
import { userApi } from "../../../features/user/api/userApi";
import { interestApi } from "../../../app/http/interestApi";
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

const INTEREST_NAME_LABEL = {
  EVENT: "행사",
  SESSION: "세션",
  EXPERIENCE: "체험",
  BOOTH: "부스",
  CONTEST: "콘테스트",
  NOTICE: "공지",
  SNACK: "간식",
  BATH_SUPPLIES: "목욕용품",
  GROOMING: "미용",
  TOY: "장난감",
  CLOTHING: "의류",
  HEALTH: "건강",
  TRAINING: "훈련",
  WALK: "산책",
  SUPPLEMENTS: "영양제",
  ACCESSORIES: "액세서리",
  OTHERS: "기타",
};

function interestLabel(name) {
  return INTEREST_NAME_LABEL[String(name || "").toUpperCase()] || String(name || "기타");
}

function buildChannelMap(rows) {
  const map = {};
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = Number(row?.interestId);
    if (!Number.isFinite(key)) return;
    map[key] = {
      allowInapp: Boolean(row?.allowInapp),
      allowEmail: Boolean(row?.allowEmail),
      allowSms: Boolean(row?.allowSms),
    };
  });
  return map;
}
function formatDateTimeDisplay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  const normalized = String(value).trim().replace("T", " ").replace(/\.\d+$/, "");
  const m = normalized.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}:\d{2}))?/);
  if (!m) return String(value);
  return `${m[1]} ${m[2] || "00:00:00"}`;
}

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
  const [subscriptions, setSubscriptions] = useState([]);
  const [channelDraftMap, setChannelDraftMap] = useState({});
  const [channelSaving, setChannelSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    nickname: "",
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
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((row) => String(row?.status || "").toUpperCase() === "ACTIVE"),
    [subscriptions],
  );
  const originalChannelMap = useMemo(
    () => buildChannelMap(activeSubscriptions),
    [activeSubscriptions],
  );
  const wideButtonStyle = { minWidth: 120, whiteSpace: "nowrap" };

  const refreshMe = async () => {
    const me = await mypageApi.getMe();
    setForm((prev) => ({
      ...prev,
      email: me?.email || "",
      phone: me?.phone || "",
      nickname: me?.nickname || "",
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

  const refreshSubscriptions = async () => {
    const rows = await interestApi.getMySubscriptions(false);
    const list = Array.isArray(rows) ? rows : [];
    setSubscriptions(list);
    setChannelDraftMap(buildChannelMap(list));
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setGlobalError("");
        const [me, rows] = await Promise.all([
          mypageApi.getMe(),
          interestApi.getMySubscriptions(false).catch(() => []),
        ]);
        if (!mounted) return;
        setForm({
          email: me?.email || "",
          phone: me?.phone || "",
          nickname: me?.nickname || "",
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
        const list = Array.isArray(rows) ? rows : [];
        setSubscriptions(list);
        setChannelDraftMap(buildChannelMap(list));
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
      setGlobalError(resolveErrorMessage(error, "프로필 수정에 실패했습니다."));
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
      setGlobalError(resolveErrorMessage(error, "휴대전화 인증 요청에 실패했습니다."));
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
      setGlobalError(resolveErrorMessage(error, "휴대전화 변경 확인에 실패했습니다."));
    } finally {
      setPhoneConfirming(false);
    }
  };

  const handleChannelToggle = (interestId, key, checked) => {
    setChannelDraftMap((prev) => ({
      ...prev,
      [interestId]: {
        allowInapp: prev?.[interestId]?.allowInapp ?? false,
        allowEmail: prev?.[interestId]?.allowEmail ?? false,
        allowSms: prev?.[interestId]?.allowSms ?? false,
        [key]: checked,
      },
    }));
  };

  const channelChanged = useMemo(() => {
    return activeSubscriptions.some((row) => {
      const interestId = Number(row?.interestId);
      const before = originalChannelMap[interestId] || {
        allowInapp: false,
        allowEmail: false,
        allowSms: false,
      };
      const after = channelDraftMap[interestId] || before;
      return (
        Boolean(before.allowInapp) !== Boolean(after.allowInapp) ||
        Boolean(before.allowEmail) !== Boolean(after.allowEmail) ||
        Boolean(before.allowSms) !== Boolean(after.allowSms)
      );
    });
  }, [activeSubscriptions, originalChannelMap, channelDraftMap]);

  const saveChannelSettings = async () => {
    try {
      setChannelSaving(true);
      setGlobalError("");

      const changedRows = activeSubscriptions.filter((row) => {
        const interestId = Number(row?.interestId);
        const before = originalChannelMap[interestId] || {
          allowInapp: false,
          allowEmail: false,
          allowSms: false,
        };
        const after = channelDraftMap[interestId] || before;
        return (
          Boolean(before.allowInapp) !== Boolean(after.allowInapp) ||
          Boolean(before.allowEmail) !== Boolean(after.allowEmail) ||
          Boolean(before.allowSms) !== Boolean(after.allowSms)
        );
      });

      if (changedRows.length === 0) {
        return;
      }

      await Promise.all(
        changedRows.map((row) => {
          const interestId = Number(row?.interestId);
          const next = channelDraftMap[interestId];
          return interestApi.updateChannels({
            interestId,
            allowInapp: Boolean(next?.allowInapp),
            allowEmail: Boolean(next?.allowEmail),
            allowSms: Boolean(next?.allowSms),
          });
        }),
      );

      await refreshSubscriptions();
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "수신 설정 저장에 실패했습니다."));
    } finally {
      setChannelSaving(false);
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
                style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle }}
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
            <label style={mypageLabelStyle}>가입일</label>
            <input value={formatDateTimeDisplay(form.createdAt)} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={mypageLabelStyle}>최근 로그인 일시</label>
            <input value={formatDateTimeDisplay(form.lastLoginAt)} style={mypageInputStyle} disabled />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={mypageLabelStyle}>최근 변경 일시</label>
            <input value={formatDateTimeDisplay(form.lastModifiedAt)} style={mypageInputStyle} disabled />
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

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>구독 알림 수신 설정</div>
            {activeSubscriptions.length === 0 ? (
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                현재 활성 구독이 없습니다. 구독 추가 후 수신 채널을 설정할 수 있습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeSubscriptions.map((row) => {
                  const interestId = Number(row?.interestId);
                  const value = channelDraftMap[interestId] || {
                    allowInapp: Boolean(row?.allowInapp),
                    allowEmail: Boolean(row?.allowEmail),
                    allowSms: Boolean(row?.allowSms),
                  };
                  return (
                    <div
                      key={`channel-${interestId}`}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "10px 12px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        {interestLabel(row?.interestName)}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(value.allowInapp)}
                            onChange={(e) => handleChannelToggle(interestId, "allowInapp", e.target.checked)}
                            disabled={channelSaving}
                          />
                          앱 알림
                        </label>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(value.allowEmail)}
                            onChange={(e) => handleChannelToggle(interestId, "allowEmail", e.target.checked)}
                            disabled={channelSaving}
                          />
                          이메일
                        </label>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(value.allowSms)}
                            onChange={(e) => handleChannelToggle(interestId, "allowSms", e.target.checked)}
                            disabled={channelSaving}
                          />
                          문자
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={saveChannelSettings}
                disabled={channelSaving || !channelChanged || activeSubscriptions.length === 0}
                style={{
                  ...mypageOutlineButtonStyle,
                  ...wideButtonStyle,
                  cursor:
                    channelSaving || !channelChanged || activeSubscriptions.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {channelSaving ? "저장 중..." : "수신 설정 저장"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
            닉네임/공개 설정은 프로필 저장 버튼으로 반영됩니다.
            구독 알림 수신 설정은 위의 수신 설정 저장 버튼으로 반영됩니다.
            이메일과 휴대전화는 아래 인증 절차로 변경할 수 있습니다.
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
                style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle }}
              >
                인증요청
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={emailVerifyInput}
                onChange={(e) => setEmailVerifyInput(e.target.value)}
                placeholder="이메일 인증 토큰 입력"
                style={mypageInputStyle}
                disabled={emailChanging || emailConfirming}
              />
              <button
                type="button"
                onClick={confirmEmailChange}
                disabled={emailChanging || emailConfirming}
                style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle }}
              >
                변경확인
              </button>
            </div>
            {emailVerifyToken ? (
              <div style={{ marginTop: 8, fontSize: 12, color: "#334155" }}>devToken: {emailVerifyToken}</div>
            ) : null}
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>휴대전화 변경 인증</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                name="nextPhone"
                value={form.nextPhone}
                onChange={handleChange}
                placeholder="새 휴대전화번호"
                style={mypageInputStyle}
                disabled={phoneChanging || phoneConfirming}
              />
              <button
                type="button"
                onClick={requestPhoneChange}
                disabled={phoneChanging || phoneConfirming}
                style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle }}
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
                style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle }}
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
              style={{ ...mypagePrimaryButtonStyle, ...wideButtonStyle, cursor: loading || saving ? "not-allowed" : "pointer" }}
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => navigate("/mypage")}
              disabled={loading || saving}
              style={{ ...mypageOutlineButtonStyle, ...wideButtonStyle, cursor: loading || saving ? "not-allowed" : "pointer" }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

