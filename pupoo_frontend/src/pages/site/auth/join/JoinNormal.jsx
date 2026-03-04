import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../api/authApi";
import { tokenStore } from "../../../../app/http/tokenStore";
import { useAuth } from "../AuthProvider";
import { petApi } from "../../../../features/pet/api/petApi";

const PET_TYPE_OPTIONS = [
  { value: "DOG", label: "강아지 (DOG)" },
  { value: "CAT", label: "고양이 (CAT)" },
  { value: "OTHER", label: "기타동물 (OTHER)" },
];

const PET_WEIGHT_OPTIONS = [
  { value: "XS", label: "XS (5kg 미만)" },
  { value: "S", label: "S (5kg ~ 9.9kg)" },
  { value: "M", label: "M (10kg ~ 19.9kg)" },
  { value: "L", label: "L (20kg ~ 34.9kg)" },
  { value: "XL", label: "XL (35kg 이상)" },
];

const DEFAULT_PET = {
  name: "",
  type: "DOG",
  age: "",
  weight: "M",
};

/**
 * ✅ JoinNormal (EMAIL 회원가입)
 * - FORM -> OTP -> COMPLETE(이메일 인증) -> 가입완료 & 자동로그인
 *
 * ✅ 안정화 포인트
 * 1) ApiResponse 래핑/unwrap 혼재 대응: getApiData() 유틸로 signupKey 파싱 통일
 * 2) 429(Too Many Requests) 사용자 메시지 + 재시도 방지
 * 3) 연타 방지: loading 가드
 * 4) PHONE 포맷 통일: 휴대폰은 digits로 전송(01012345678)
 */

// 스타일 그대로 유지 (사용자 제공)
const styles = `

  body {
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    background: #fff;
    color: #333;
    font-size: 14px;
  }

  .signup-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 140px 20px 80px;
  }

  .signup-title {
    text-align: center;
    font-size: 28px;
    font-weight: 700;
    color: #222;
    margin-bottom: 50px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 10px;
    border-bottom: 2px solid #333;
  }

  .required-note {
    font-size: 12px;
    color: #666;
  }

  .required-note span {
    color: #1a9ac9;
  }

  .form-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 40px;
  }

  .form-table tr {
    border-bottom: 1px solid #e5e5e5;
  }

  .form-table tr:first-child {
    border-top: none;
  }

  .form-table th {
    background: #f8f8f8;
    padding: 18px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #444;
    text-align: left;
    width: 220px;
    vertical-align: middle;
  }

  .form-table td {
    padding: 14px 20px;
    vertical-align: middle;
  }

  .req {
    color: #1a9ac9;
    margin-left: 2px;
  }

  .form-input {
    width: 100%;
    max-width: 500px;
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 12px;
    font-size: 14px;
    color: #333;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    border-color: #1a9ac9;
  }

  .form-input::placeholder {
    color: #aaa;
    font-size: 13px;
  }

  .radio-group {
    display: flex;
    gap: 30px;
    align-items: center;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #444;
  }

  .radio-label input[type="radio"] {
    accent-color: #1a9ac9;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .phone-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .phone-select {
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 8px;
    font-size: 14px;
    color: #333;
    background: #fff;
    outline: none;
    cursor: pointer;
    min-width: 80px;
  }

  .phone-input {
    height: 42px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 120px;
  }

  .phone-input:focus, .phone-select:focus {
    border-color: #1a9ac9;
  }

  .address-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 500px;
  }

  .address-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn-postcode {
    height: 42px;
    padding: 0 18px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-postcode:hover {
    background: #666;
  }

  .address-input {
    flex: 1;
    height: 48px;
    line-height: 48px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 14px;
    font-size: 14px;
    color: #333;
    outline: none;
  }

  .address-input:focus {
    border-color: #1a9ac9;
  }

  .address-input::placeholder {
    color: #aaa;
    font-size: 13px;
  }

  .identity-btn {
    height: 42px;
    padding: 0 24px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 14px;
    cursor: pointer;
    margin-right: 12px;
  }

  .identity-btn:hover {
    background: #666;
  }

  .identity-note {
    font-size: 13px;
    color: #555;
  }

  .auto-fill-note {
    font-size: 13px;
    color: #1a9ac9;
  }

  .pet-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pet-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pet-label {
    font-size: 13px;
    color: #555;
    min-width: 60px;
  }

  .pet-select {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    background: #fff;
    outline: none;
    cursor: pointer;
    min-width: 100px;
  }

  .pet-select:focus {
    border-color: #1a9ac9;
  }

  .pet-name-input {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 120px;
  }

  .pet-name-input:focus {
    border-color: #1a9ac9;
  }

  .pet-age-input {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 80px;
  }

  .pet-age-input:focus {
    border-color: #1a9ac9;
  }

  .pet-size-select {
    height: 38px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0 10px;
    font-size: 13px;
    color: #333;
    background: #fff;
    outline: none;
    cursor: pointer;
    min-width: 160px;
  }

  .pet-size-select:focus {
    border-color: #1a9ac9;
  }

  .pet-size-note {
    font-size: 12px;
    color: #666;
  }

  .pet-age-unit {
    font-size: 13px;
    color: #555;
  }

  .btn-add-pet {
    height: 34px;
    width: 34px;
    background: #1a9ac9;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-add-pet:hover {
    background: #1588b0;
  }

  .btn-remove-pet {
    height: 34px;
    width: 34px;
    background: #bbb;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-remove-pet:hover {
    background: #999;
  }

  .btn-remove-pet:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .submit-wrap {
    text-align: center;
    margin-top: 20px;
  }

  .btn-submit {
    height: 50px;
    padding: 0 60px;
    background: #1a9ac9;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 0 6px;
    transition: background 0.2s;
  }

  .btn-submit:hover {
    background: #1588b0;
  }

  .btn-cancel {
    height: 50px;
    padding: 0 60px;
    background: #888;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 0 6px;
    transition: background 0.2s;
  }

  .btn-cancel:hover {
    background: #666;
  }

  .error-text {
    color: #e11d48;
    margin-top: -20px;
    margin-bottom: 20px;
    font-size: 13px;
    white-space: pre-line;
  }
`;

// ✅ ApiResponse / unwrap 혼재 대응 유틸
function getApiData(res) {
  // 1) 이미 data(T)로 unwrap된 경우
  if (
    res &&
    typeof res === "object" &&
    ("signupKey" in res || "accessToken" in res)
  ) {
    return res;
  }
  // 2) ApiResponse<T>를 그대로 받은 경우: { success, data, error }
  if (res && typeof res === "object" && "data" in res) {
    return res.data;
  }
  return null;
}

const digitsOnly = (s) => (s || "").replace(/[^0-9]/g, "");

function parsePetsForCreate(pets) {
  const rows = Array.isArray(pets) ? pets : [];
  const payloads = [];

  for (const pet of rows) {
    const petName = String(pet?.name || "").trim();
    const rawAge = String(pet?.age ?? "").trim();
    const hasAnyInput = petName || rawAge;
    if (!hasAnyInput) continue;

    if (!petName) {
      throw new Error("반려동물 이름을 입력해 주세요.");
    }
    if (!rawAge) {
      throw new Error("반려동물 나이를 입력해 주세요.");
    }

    const petAge = Number(rawAge);
    if (!Number.isInteger(petAge) || petAge < 0 || petAge > 100) {
      throw new Error("반려동물 나이는 0~100 사이 정수로 입력해 주세요.");
    }

    const type = String(pet?.type || "DOG").toUpperCase();
    const petBreed = ["DOG", "CAT", "OTHER"].includes(type) ? type : "DOG";
    const selectedWeight = String(pet?.weight || "M").toUpperCase();
    const petWeight = ["XS", "S", "M", "L", "XL"].includes(selectedWeight)
      ? selectedWeight
      : "M";

    payloads.push({
      petName,
      petBreed,
      petAge,
      petWeight: petBreed === "DOG" ? petWeight : "M",
    });
  }

  return payloads;
}

export default function JoinNormal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [memberType, setMemberType] = useState("individual");

  const [form, setForm] = useState({
    id: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    name: "",
    email: "",
    tel1: "02",
    tel2: "",
    tel3: "",
    mobile1: "010",
    mobile2: "",
    mobile3: "",
    postcode: "",
    address: "",
    addressDetail: "",
    employeeId: "",
  });

  const [pets, setPets] = useState([{ ...DEFAULT_PET }]);
  const [error, setError] = useState("");

  // ✅ 플로우
  const [step, setStep] = useState("FORM"); // FORM -> OTP -> COMPLETE
  const [signupKey, setSignupKey] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ EMAIL 가입: 이메일 인증 상태
  const [emailRequested, setEmailRequested] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCode, setEmailCode] = useState("");

  // ✅ OTP 쿨다운(429 UX)
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(
      () => setOtpCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [otpCooldown]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberOnlyChange = (e) => {
    const { name, value } = e.target;
    const onlyNumber = value.replace(/[^0-9]/g, "");
    setForm((prev) => ({ ...prev, [name]: onlyNumber }));
  };

  const openPostcode = () => {
    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
          if (data.bname !== "") extraAddress += data.bname;
          if (data.buildingName !== "") {
            extraAddress +=
              extraAddress !== ""
                ? `, ${data.buildingName}`
                : data.buildingName;
          }
          fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }

        setForm((prev) => ({
          ...prev,
          postcode: data.zonecode,
          address: fullAddress,
        }));
      },
    }).open();
  };

  const handlePetChange = (index, field, value) => {
    setPets((prev) => {
      const updated = [...prev];
      const next = { ...updated[index], [field]: value };

      if (field === "type") {
        const type = String(value || "DOG").toUpperCase();
        next.type = type;
        if (type !== "DOG") next.weight = "M";
      }

      updated[index] = next;
      return updated;
    });
  };

  const addPet = () => setPets((prev) => [...prev, { ...DEFAULT_PET }]);

  const removePet = (index) => {
    if (pets.length === 1) return;
    setPets((prev) => prev.filter((_, i) => i !== index));
  };

  const phoneTel = useMemo(() => {
    const t2 = (form.tel2 || "").trim();
    const t3 = (form.tel3 || "").trim();
    if (!t2 && !t3) return "";
    return `${form.tel1}-${t2}-${t3}`;
  }, [form.tel1, form.tel2, form.tel3]);

  const phoneMobileText = useMemo(() => {
    const m2 = (form.mobile2 || "").trim();
    const m3 = (form.mobile3 || "").trim();
    if (!m2 || !m3) return "";
    return `${form.mobile1}-${m2}-${m3}`;
  }, [form.mobile1, form.mobile2, form.mobile3]);

  // ✅ API 전송용 휴대폰(숫자만)
  const phoneMobileDigits = useMemo(() => {
    const m2 = digitsOnly(form.mobile2);
    const m3 = digitsOnly(form.mobile3);
    if (!m2 || !m3) return "";
    return `${digitsOnly(form.mobile1)}${m2}${m3}`;
  }, [form.mobile1, form.mobile2, form.mobile3]);

  // --- SOCIAL 상태 복원(필요 시) ---
  const socialStateFromRoute =
    location.state && location.state.signupType === "SOCIAL"
      ? location.state
      : null;

  const socialStateFromStorage = (() => {
    const uid = sessionStorage.getItem("kakao_provider_uid");
    if (!uid) return null;
    return {
      signupType: "SOCIAL",
      socialProvider: "KAKAO",
      socialProviderUid: uid,
      email: sessionStorage.getItem("kakao_email") ?? "",
      nickname: sessionStorage.getItem("kakao_nickname") ?? "",
      phone: "",
    };
  })();

  const socialState = socialStateFromRoute ?? socialStateFromStorage;
  const isSocial = socialState?.signupType === "SOCIAL";

  useEffect(() => {
    if (!isSocial) return;
    setForm((prev) => ({
      ...prev,
      email: socialState.email ?? prev.email,
      nickname: socialState.nickname ?? prev.nickname,
    }));
  }, [isSocial, socialState]);

  // ✅ 1) Start (가입 세션 + OTP 발송)
  const signupStart = async () => {
    if (loading) return; // ✅ 연타 방지
    if (otpCooldown > 0) {
      throw new Error(
        `OTP 재요청 대기 중입니다. ${otpCooldown}초 후 다시 시도해주세요.`,
      );
    }

    // 공통 필수
    if (!form.nickname?.trim()) throw new Error("닉네임을 입력하세요.");
    if (!phoneMobileDigits) throw new Error("휴대전화 번호를 완성해주세요.");

    // EMAIL 가입
    if (!isSocial) {
      if (!form.email.trim()) throw new Error("이메일을 입력하세요.");
      if (!form.password) throw new Error("비밀번호를 입력하세요.");
      if (form.password !== form.passwordConfirm)
        throw new Error("비밀번호가 일치하지 않습니다.");
    } else {
      // SOCIAL 가입(JoinNormal을 소셜로도 재사용하는 경우)
      if (!form.email.trim()) throw new Error("이메일을 입력하세요.");
      if (!socialState?.socialProviderUid) {
        throw new Error(
          "소셜 UID가 없습니다. 카카오 콜백부터 다시 진행해주세요.",
        );
      }
      // ⚠️ SOCIAL도 백엔드가 password를 필수로 요구한다면 여기서 임시 비번을 생성해야 함.
      // 현재는 KakaoJoin에서 처리하므로 JoinNormal은 EMAIL 기준으로 사용하는 것을 권장.
    }

    setLoading(true);
    setError("");
    try {
      const payload = isSocial
        ? {
            signupType: "SOCIAL",
            socialProvider: socialState.socialProvider ?? "KAKAO",
            socialProviderUid: socialState.socialProviderUid,
            email: form.email.trim(),
            nickname: form.nickname.trim(),
            phone: phoneMobileDigits,
          }
        : {
            signupType: "EMAIL",
            email: form.email.trim(),
            password: form.password,
            nickname: form.nickname.trim(),
            phone: phoneMobileDigits,
          };

      const res = await authApi.signupStart(payload);

      const data = getApiData(res);
      const key = data?.signupKey;

      if (!key) {
        console.error("signupStart response =", res);
        throw new Error("signupStart 응답에 signupKey가 없습니다.");
      }

      setSignupKey(key);
      setStep("OTP");

      if (data?.otpCooldownSeconds)
        setOtpCooldown(Number(data.otpCooldownSeconds) || 0);
      if (data?.devOtp) setOtpCode(String(data.devOtp));
    } catch (e) {
      const status = e?.response?.status;
      if (status === 429) {
        // 서버가 내려주는 Retry-After 또는 data.otpCooldownSeconds 활용 가능
        const retryAfter = Number(e?.response?.headers?.["retry-after"]);
        const cool =
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
        setOtpCooldown(cool);
        throw new Error(
          `OTP 요청이 너무 많습니다. ${cool}초 후 다시 시도해주세요.`,
        );
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2) Verify OTP
  const verifyOtp = async () => {
    if (loading) return;
    if (!signupKey) throw new Error("signupKey가 없습니다. 다시 시도해주세요.");
    if (!otpCode.trim()) throw new Error("인증번호(OTP)를 입력하세요.");
    if (!phoneMobileDigits) throw new Error("휴대전화 번호를 완성해주세요.");

    setLoading(true);
    setError("");
    try {
      await authApi.signupVerifyOtp({
        signupKey,
        phone: phoneMobileDigits,
        otpCode: otpCode.trim(),
      });

      // EMAIL이면 COMPLETE 단계로
      setStep("COMPLETE");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3) 이메일 인증 메일 요청
  const requestEmailVerification = async () => {
    if (loading) return;
    if (!signupKey) return setError("signupKey가 없습니다.");
    setError("");
    setLoading(true);

    try {
      const res = await authApi.signupEmailRequest({ signupKey });

      // unwrap 혼재 대응
      const body = res?.data ?? res;
      const devCode =
        body?.data?.devCode || body?.devCode || body?.data?.code || "";

      if (devCode) setEmailCode(devCode);
      setEmailRequested(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "이메일 인증 요청 실패",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ 4) 이메일 인증 확인
  const confirmEmailVerification = async () => {
    if (loading) return;
    if (!signupKey) return setError("signupKey가 없습니다.");
    if (!emailCode.trim()) return setError("이메일 인증 코드를 입력하세요.");

    setError("");
    setLoading(true);
    try {
      await authApi.signupEmailConfirm({
        signupKey,
        code: emailCode.trim(),
      });
      setEmailVerified(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "이메일 인증 확인 실패",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ 5) Complete (users 생성 + 토큰 발급)
  const completeSignup = async () => {
    if (loading) return;
    if (!signupKey) throw new Error("signupKey가 없습니다. 다시 시도해주세요.");
    if (!emailVerified) throw new Error("이메일 인증을 완료해주세요.");
    const petPayloads = parsePetsForCreate(pets);

    setLoading(true);
    setError("");
    try {
      const res = await authApi.signupComplete({ signupKey });

      const data = getApiData(res);
      const accessToken = data?.accessToken;

      if (!accessToken) {
        console.error("signupComplete response =", res);
        throw new Error("회원가입 완료 응답에 accessToken이 없습니다.");
      }

      tokenStore.setAccess(accessToken);
      login();

      if (petPayloads.length > 0) {
        try {
          await Promise.all(petPayloads.map((pet) => petApi.createPet(pet)));
        } catch (petError) {
          console.error("[JoinNormal] pet create failed:", petError);
          window.alert(
            "회원가입은 완료되었지만 반려동물 저장에 실패했습니다. 마이페이지에서 다시 등록해 주세요.",
          );
        }
      }

      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Submit: step에 따라 분기
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (step === "FORM") {
        await signupStart();
        return;
      }
      if (step === "OTP") {
        await verifyOtp();
        return;
      }
      if (step === "COMPLETE") {
        await completeSignup();
        return;
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? "회원가입 실패");
    }
  };

  const stepTitle = useMemo(() => {
    if (step === "FORM") return "회원가입 정보 입력";
    if (step === "OTP") return "휴대폰 인증(OTP)";
    return "가입 완료";
  }, [step]);

  return (
    <>
      <style>{styles}</style>

      <form className="signup-wrap" onSubmit={handleSubmit}>
        <h1 className="signup-title">회원가입</h1>

        <div style={{ marginBottom: 20, color: "#666", fontSize: 13 }}>
          현재 단계: <b>{stepTitle}</b>
          {otpCooldown > 0 && (
            <span style={{ marginLeft: 10, color: "#e11d48" }}>
              (OTP 재요청 대기: {otpCooldown}s)
            </span>
          )}
          {signupKey && (
            <span style={{ marginLeft: 10, color: "#999" }}>
              (signupKey: {String(signupKey).slice(0, 8)}…)
            </span>
          )}
        </div>

        {/* 회원구분 */}
        <p className="section-title">회원구분</p>
        <table className="form-table">
          <tbody>
            <tr>
              <th>회원구분</th>
              <td>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="memberType"
                      value="individual"
                      checked={memberType === "individual"}
                      onChange={() => setMemberType("individual")}
                      disabled={loading || step !== "FORM"}
                    />
                    개인회원
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="memberType"
                      value="business"
                      checked={memberType === "business"}
                      onChange={() => setMemberType("business")}
                      disabled={loading || step !== "FORM"}
                    />
                    사업자회원
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <th>회원인증</th>
              <td>
                <button type="button" className="identity-btn" disabled>
                  본인인증
                </button>
                <span className="identity-note">
                  (현재는 OTP로 인증합니다) 본인 명의의 휴대폰으로 인증을
                  진행합니다.
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 가입정보 */}
        <div className="section-header">
          <span
            className="section-title"
            style={{ borderBottom: "none", paddingBottom: 0 }}
          >
            가입정보
          </span>
          <span className="required-note">
            <span>*</span> 표시는 반드시 입력하셔야 합니다.
          </span>
        </div>

        <table className="form-table" style={{ borderTop: "2px solid #333" }}>
          <tbody>
            <tr>
              <th>아이디</th>
              <td>
                <input
                  className="form-input"
                  type="text"
                  name="id"
                  value={form.id}
                  onChange={handleFormChange}
                  placeholder="(미사용) 이메일이 로그인 ID 역할"
                  disabled
                />
              </td>
            </tr>

            {/* EMAIL 가입 전용 비밀번호 */}
            {!isSocial && (
              <>
                <tr>
                  <th>
                    비밀번호 <span className="req">*</span>
                  </th>
                  <td>
                    <input
                      className="form-input"
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="8~16자"
                      disabled={loading || step !== "FORM"}
                    />
                  </td>
                </tr>

                <tr>
                  <th>
                    비밀번호 확인 <span className="req">*</span>
                  </th>
                  <td>
                    <input
                      className="form-input"
                      type="password"
                      name="passwordConfirm"
                      value={form.passwordConfirm}
                      onChange={handleFormChange}
                      disabled={loading || step !== "FORM"}
                    />
                  </td>
                </tr>
              </>
            )}

            <tr>
              <th>
                닉네임 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="text"
                  name="nickname"
                  value={form.nickname || ""}
                  onChange={handleFormChange}
                  placeholder="닉네임을 입력하세요"
                  disabled={loading || step !== "FORM"}
                />
              </td>
            </tr>

            <tr>
              <th>이름</th>
              <td>
                <span className="auto-fill-note">
                  ※ 본인인증 후 자동 입력 됩니다.
                </span>
              </td>
            </tr>

            <tr>
              <th>
                이메일 <span className="req">*</span>
              </th>
              <td>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  disabled={loading || step !== "FORM"}
                />
              </td>
            </tr>

            <tr>
              <th>일반전화</th>
              <td>
                <div className="phone-group">
                  <select
                    className="phone-select"
                    name="tel1"
                    value={form.tel1}
                    onChange={handleFormChange}
                    disabled={loading || step !== "FORM"}
                  >
                    <option value="02">02</option>
                    <option value="031">031</option>
                    <option value="032">032</option>
                    <option value="033">033</option>
                    <option value="041">041</option>
                    <option value="042">042</option>
                    <option value="043">043</option>
                    <option value="051">051</option>
                    <option value="052">052</option>
                    <option value="053">053</option>
                    <option value="054">054</option>
                    <option value="055">055</option>
                    <option value="061">061</option>
                    <option value="062">062</option>
                    <option value="063">063</option>
                    <option value="064">064</option>
                  </select>

                  <input
                    className="phone-input"
                    type="text"
                    name="tel2"
                    value={form.tel2}
                    onChange={handleNumberOnlyChange}
                    maxLength={4}
                    disabled={loading || step !== "FORM"}
                  />
                  <input
                    className="phone-input"
                    type="text"
                    name="tel3"
                    value={form.tel3}
                    onChange={handleNumberOnlyChange}
                    maxLength={4}
                    disabled={loading || step !== "FORM"}
                  />
                </div>

                {phoneTel && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                    입력된 전화: {phoneTel}
                  </div>
                )}
              </td>
            </tr>

            <tr>
              <th>
                휴대전화 <span className="req">*</span>
              </th>
              <td>
                <div className="phone-group">
                  <select
                    className="phone-select"
                    name="mobile1"
                    value={form.mobile1}
                    onChange={handleFormChange}
                    disabled={loading || step !== "FORM"}
                  >
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                    <option value="017">017</option>
                    <option value="018">018</option>
                    <option value="019">019</option>
                  </select>

                  <input
                    className="phone-input"
                    type="text"
                    name="mobile2"
                    value={form.mobile2}
                    onChange={handleNumberOnlyChange}
                    maxLength={4}
                    disabled={loading || step !== "FORM"}
                  />
                  <input
                    className="phone-input"
                    type="text"
                    name="mobile3"
                    value={form.mobile3}
                    onChange={handleNumberOnlyChange}
                    maxLength={4}
                    disabled={loading || step !== "FORM"}
                  />
                </div>

                {phoneMobileText && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                    입력된 휴대전화: {phoneMobileText}
                  </div>
                )}
              </td>
            </tr>

            <tr>
              <th>주소</th>
              <td>
                <div className="address-group">
                  <div className="address-row">
                    <input
                      className="address-input"
                      type="text"
                      name="postcode"
                      value={form.postcode}
                      onChange={handleNumberOnlyChange}
                      style={{ maxWidth: 160 }}
                      disabled={loading || step !== "FORM"}
                    />
                    <button
                      type="button"
                      className="btn-postcode"
                      onClick={openPostcode}
                      disabled={loading || step !== "FORM"}
                    >
                      우편번호
                    </button>
                  </div>

                  <input
                    className="address-input"
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleFormChange}
                    placeholder="기본주소"
                    disabled={loading || step !== "FORM"}
                  />
                  <input
                    className="address-input"
                    type="text"
                    name="addressDetail"
                    value={form.addressDetail}
                    onChange={handleFormChange}
                    placeholder="나머지주소"
                    disabled={loading || step !== "FORM"}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ✅ OTP 단계 UI */}
        {step === "OTP" && (
          <div style={{ marginTop: 10, marginBottom: 30 }}>
            <p className="section-title">휴대폰 인증(OTP)</p>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                className="form-input"
                style={{ maxWidth: 260 }}
                type="text"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="인증번호 6자리"
                maxLength={6}
                inputMode="numeric"
                disabled={loading}
              />
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "검증 중..." : "OTP 검증"}
              </button>

              <button
                type="button"
                className="btn-cancel"
                disabled={loading}
                onClick={() => {
                  setStep("FORM");
                  setSignupKey(null);
                  setOtpCode("");
                  setEmailRequested(false);
                  setEmailVerified(false);
                  setEmailCode("");
                }}
              >
                처음으로
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              가입 시작 시 입력한 휴대폰으로 인증번호가 발송됩니다.
            </div>
          </div>
        )}

        {/* ✅ COMPLETE 단계: EMAIL만 이메일 인증 UI 표시 */}
        {step === "COMPLETE" && (
          <div style={{ marginTop: 10, marginBottom: 30 }}>
            <p className="section-title">가입 완료</p>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="btn-cancel"
                onClick={requestEmailVerification}
                disabled={loading || emailRequested}
              >
                {emailRequested ? "메일 요청 완료" : "이메일 인증 메일 요청"}
              </button>

              <input
                className="form-input"
                style={{ maxWidth: 260 }}
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="이메일 인증 코드 입력"
                disabled={loading || !emailRequested || emailVerified}
              />

              <button
                type="button"
                className="btn-cancel"
                onClick={confirmEmailVerification}
                disabled={loading || !emailRequested || emailVerified}
              >
                {emailVerified ? "이메일 인증 완료" : "이메일 인증 확인"}
              </button>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !emailVerified}
              >
                {loading ? "처리 중..." : "가입 완료 & 로그인"}
              </button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              OTP 검증이 완료되었습니다. EMAIL 가입은 이메일 인증 후 가입을
              완료할 수 있습니다.
            </div>
          </div>
        )}

        {/* 추가정보 */}
        <p className="section-title">추가정보</p>
        <table className="form-table" style={{ borderTop: "2px solid #333" }}>
          <tbody>
            <tr>
              <th>반려동물 정보</th>
              <td>
                <div className="pet-rows">
                  {pets.map((pet, index) => (
                    <div className="pet-row" key={index}>
                      <span className="pet-label">Pet {index + 1}</span>

                      <input
                        className="pet-name-input"
                        type="text"
                        value={pet.name}
                        onChange={(e) =>
                          handlePetChange(index, "name", e.target.value)
                        }
                        placeholder="이름"
                        disabled={loading}
                      />

                      <select
                        className="pet-select"
                        value={pet.type}
                        onChange={(e) =>
                          handlePetChange(index, "type", e.target.value)
                        }
                        disabled={loading}
                      >
                        {PET_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        className="pet-age-input"
                        type="number"
                        min="0"
                        max="100"
                        value={pet.age}
                        onChange={(e) =>
                          handlePetChange(index, "age", e.target.value)
                        }
                        placeholder="나이"
                        disabled={loading}
                      />
                      <span className="pet-age-unit">살</span>

                      {pet.type === "DOG" ? (
                        <select
                          className="pet-size-select"
                          value={pet.weight}
                          onChange={(e) =>
                            handlePetChange(index, "weight", e.target.value)
                          }
                          disabled={loading}
                        >
                          {PET_WEIGHT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="pet-size-note">
                          강아지가 아닐 경우 사이즈는 기본값(M)으로 저장됩니다.
                        </span>
                      )}

                      <button
                        type="button"
                        className="btn-remove-pet"
                        onClick={() => removePet(index)}
                        disabled={loading || pets.length === 1}
                        title="반려동물 삭제"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        className="btn-add-pet"
                        onClick={addPet}
                        disabled={loading}
                        title="반려동물 추가"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                  ※ 입력한 반려동물 정보는 가입 완료 후 내 계정에 자동 등록됩니다.
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {error && <div className="error-text">{error}</div>}

        <div className="submit-wrap">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            취소
          </button>

          {step === "FORM" && (
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || otpCooldown > 0}
              title={
                otpCooldown > 0
                  ? `OTP 재요청 대기 중 (${otpCooldown}s)`
                  : undefined
              }
            >
              {loading
                ? "처리 중..."
                : otpCooldown > 0
                  ? `재시도 (${otpCooldown}s)`
                  : "가입 시작(OTP 발송)"}
            </button>
          )}

          {step === "OTP" && (
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "검증 중..." : "OTP 검증"}
            </button>
          )}

          {step === "COMPLETE" && (
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !emailVerified}
            >
              {loading ? "처리 중..." : "가입 완료 & 로그인"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
