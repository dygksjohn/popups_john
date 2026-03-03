import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { mypageApi } from "./api/mypageApi";
import { settingsApi } from "../../../app/http/settingsApi";

const PET_BREEDS = ["DOG", "CAT", "OTHER"];
const PET_WEIGHTS = ["XS", "S", "M", "L", "XL"];

const SIDE_MENU = [
  { id: "profile", label: "프로필" },
  { id: "pets", label: "반려동물" },
  { id: "applications", label: "신청 이력" },
  { id: "payments", label: "결제 이력" },
  { id: "notifications", label: "알림 설정" },
  { id: "qr", label: "QR" },
  { id: "account", label: "계정 관리" },
];

function normalizePageItems(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.list)) return value.list;
  if (Array.isArray(value?.data?.content)) return value.data.content;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
}

function getStatusLabel(status) {
  const key = String(status || "").toUpperCase();
  if (key.includes("CANCEL")) return "취소";
  if (key.includes("COMPLETE") || key.includes("DONE")) return "완료";
  if (key.includes("APPROVE") || key.includes("CONFIRM")) return "확정";
  if (key.includes("WAIT") || key.includes("PENDING")) return "대기";
  return status || "-";
}

const styles = `
.mypage-shell {
  max-width: 1320px;
  margin: 0 auto;
  padding: 120px 20px 64px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  color: #0f172a;
}

.mypage-sidebar {
  position: sticky;
  top: 90px;
  align-self: start;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.mypage-sidebar-head {
  padding: 20px 18px;
  border-bottom: 1px solid #eef2f7;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
}

.mypage-sidebar-name {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 800;
}

.mypage-sidebar-email {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  word-break: break-all;
}

.mypage-sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 6px;
}

.mypage-sidebar-nav button {
  border: none;
  background: #fff;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}

.mypage-sidebar-nav button:hover {
  background: #f1f5f9;
}

.mypage-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mypage-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 20px;
}

.mypage-card h3 {
  margin: 0 0 14px;
  font-size: 18px;
}

.mypage-grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mypage-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mypage-field label {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.mypage-field input,
.mypage-field select {
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.mypage-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.btn-primary,
.btn-outline,
.btn-danger {
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  border: none;
  background: #1d4ed8;
  color: #fff;
}

.btn-outline {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn-danger {
  border: none;
  background: #dc2626;
  color: #fff;
}

.mypage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mypage-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

.mypage-item-title {
  font-size: 14px;
  font-weight: 700;
}

.mypage-item-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.mypage-empty {
  color: #64748b;
  font-size: 14px;
}

.mypage-error {
  margin-bottom: 12px;
  color: #be123c;
  font-size: 13px;
}

.mypage-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mypage-toggle input {
  width: 18px;
  height: 18px;
}

@media (max-width: 960px) {
  .mypage-shell {
    grid-template-columns: 1fr;
    padding-top: 96px;
  }

  .mypage-sidebar {
    position: static;
  }

  .mypage-grid-two {
    grid-template-columns: 1fr;
  }
}
`;

export default function Mypage() {
  const navigate = useNavigate();
  const { isAuthed, isBootstrapped, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [error, setError] = useState("");
  const [petFormError, setPetFormError] = useState("");

  const [me, setMe] = useState(null);
  const [pets, setPets] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [programApplies, setProgramApplies] = useState([]);
  const [allowMarketing, setAllowMarketing] = useState(false);

  const [editForm, setEditForm] = useState({ nickname: "", phone: "" });
  const [petForm, setPetForm] = useState({
    petName: "",
    petBreed: "DOG",
    petAge: "",
    petWeight: "M",
  });

  const fetchData = useCallback(async () => {
    if (!isBootstrapped) return;
    if (!isAuthed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [meRes, petsRes, eventRes, programRes, notificationSettings] =
        await Promise.all([
          mypageApi.getMe(),
          mypageApi.getMyPets(),
          mypageApi.getMyEventRegistrations({ page: 0, size: 20 }),
          mypageApi.getMyProgramApplies({ page: 0, size: 20 }),
          settingsApi.getNotificationSettings().catch(() => null),
        ]);

      const nextMe = meRes || null;
      setMe(nextMe);
      setEditForm({
        nickname: nextMe?.nickname || "",
        phone: nextMe?.phone || "",
      });

      setPets(Array.isArray(petsRes) ? petsRes : []);
      setEventRegistrations(normalizePageItems(eventRes));
      setProgramApplies(normalizePageItems(programRes));
      setAllowMarketing(Boolean(notificationSettings?.allowMarketing));
    } catch (e) {
      setError(e?.message || "마이페이지 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [isAuthed, isBootstrapped]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const profileSummary = useMemo(
    () => [
      { label: "이메일", value: me?.email || "-" },
      { label: "닉네임", value: me?.nickname || "-" },
      { label: "연락처", value: me?.phone || "-" },
    ],
    [me],
  );

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEditInput = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePetInput = (e) => {
    const { name, value } = e.target;
    setPetForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPet = async () => {
    const petName = String(petForm.petName || "").trim();
    const petAge = Number(petForm.petAge);

    if (!petName) {
      setPetFormError("반려동물 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(petAge) || petAge < 0 || petAge > 100) {
      setPetFormError("반려동물 나이는 0~100 범위로 입력해 주세요.");
      return;
    }

    setAddingPet(true);
    setPetFormError("");
    try {
      await mypageApi.createPet({
        petName,
        petBreed: String(petForm.petBreed || "DOG").toUpperCase(),
        petAge,
        petWeight: String(petForm.petWeight || "M").toUpperCase(),
      });
      setPetForm({ petName: "", petBreed: "DOG", petAge: "", petWeight: "M" });
      await fetchData();
    } catch (e) {
      setPetFormError(e?.message || "반려동물 추가에 실패했습니다.");
    } finally {
      setAddingPet(false);
    }
  };

  const handleSaveBasicInfo = async () => {
    setSaving(true);
    setError("");
    try {
      await mypageApi.updateMe({
        nickname: editForm.nickname,
        phone: editForm.phone,
      });
      await fetchData();
    } catch (e) {
      setError(e?.message || "기본정보 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMarketing = async () => {
    setSettingsSaving(true);
    setError("");
    try {
      const updated = await settingsApi.updateNotificationSettings(!allowMarketing);
      setAllowMarketing(Boolean(updated?.allowMarketing));
    } catch (e) {
      setError(e?.message || "알림 설정 저장에 실패했습니다.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteMe = async () => {
    const ok = window.confirm("정말 탈퇴하시겠습니까?");
    if (!ok) return;

    try {
      await mypageApi.deleteMe();
      await logout();
      navigate("/", { replace: true });
    } catch (e) {
      setError(e?.message || "회원 탈퇴에 실패했습니다.");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <main className="mypage-shell">
        <aside className="mypage-sidebar">
          <div className="mypage-sidebar-head">
            <p className="mypage-sidebar-name">{me?.nickname || "사용자"}</p>
            <p className="mypage-sidebar-email">{me?.email || "-"}</p>
          </div>
          <div className="mypage-sidebar-nav">
            {SIDE_MENU.map((menu) => (
              <button key={menu.id} type="button" onClick={() => scrollToSection(menu.id)}>
                {menu.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="mypage-content">
          {error ? <div className="mypage-error">{error}</div> : null}

          <section id="profile" className="mypage-card">
            <h3>프로필</h3>
            {loading ? (
              <div className="mypage-empty">프로필을 불러오는 중입니다.</div>
            ) : (
              <>
                <div className="mypage-grid-two">
                  {profileSummary.map((item) => (
                    <div key={item.label} className="mypage-item">
                      <div className="mypage-item-title">{item.label}</div>
                      <div className="mypage-item-meta">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mypage-grid-two" style={{ marginTop: 12 }}>
                  <div className="mypage-field">
                    <label htmlFor="nickname">닉네임</label>
                    <input
                      id="nickname"
                      name="nickname"
                      value={editForm.nickname}
                      onChange={handleEditInput}
                      disabled={saving}
                    />
                  </div>
                  <div className="mypage-field">
                    <label htmlFor="phone">연락처</label>
                    <input
                      id="phone"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditInput}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="mypage-actions">
                  <button className="btn-primary" type="button" onClick={handleSaveBasicInfo} disabled={saving}>
                    {saving ? "저장 중..." : "기본정보 저장"}
                  </button>
                </div>
              </>
            )}
          </section>

          <section id="pets" className="mypage-card">
            <h3>반려동물</h3>
            {loading ? (
              <div className="mypage-empty">반려동물 정보를 불러오는 중입니다.</div>
            ) : (
              <>
                {pets.length === 0 ? (
                  <div className="mypage-empty">등록된 반려동물이 없습니다.</div>
                ) : (
                  <div className="mypage-list">
                    {pets.map((pet, idx) => {
                      const petId = pet?.petId ?? pet?.id ?? idx;
                      return (
                        <div className="mypage-item" key={petId}>
                          <div className="mypage-item-title">{pet?.petName ?? pet?.name ?? "-"}</div>
                          <div className="mypage-item-meta">
                            종류: {pet?.petBreed ?? pet?.type ?? "-"} | 나이: {pet?.petAge ?? pet?.age ?? "-"} | 체중:{" "}
                            {pet?.petWeight ?? "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mypage-grid-two" style={{ marginTop: 14 }}>
                  <div className="mypage-field">
                    <label htmlFor="petName">이름</label>
                    <input
                      id="petName"
                      name="petName"
                      value={petForm.petName}
                      onChange={handlePetInput}
                      disabled={addingPet}
                    />
                  </div>
                  <div className="mypage-field">
                    <label htmlFor="petAge">나이</label>
                    <input
                      id="petAge"
                      name="petAge"
                      type="number"
                      min={0}
                      max={100}
                      value={petForm.petAge}
                      onChange={handlePetInput}
                      disabled={addingPet}
                    />
                  </div>
                  <div className="mypage-field">
                    <label htmlFor="petBreed">동물 타입</label>
                    <select
                      id="petBreed"
                      name="petBreed"
                      value={petForm.petBreed}
                      onChange={handlePetInput}
                      disabled={addingPet}
                    >
                      {PET_BREEDS.map((breed) => (
                        <option key={breed} value={breed}>
                          {breed}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mypage-field">
                    <label htmlFor="petWeight">체중 구간</label>
                    <select
                      id="petWeight"
                      name="petWeight"
                      value={petForm.petWeight}
                      onChange={handlePetInput}
                      disabled={addingPet}
                    >
                      {PET_WEIGHTS.map((weight) => (
                        <option key={weight} value={weight}>
                          {weight}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mypage-actions">
                  <button className="btn-primary" type="button" onClick={handleAddPet} disabled={addingPet}>
                    {addingPet ? "추가 중..." : "반려동물 추가"}
                  </button>
                </div>
                {petFormError ? <div className="mypage-error" style={{ marginTop: 8 }}>{petFormError}</div> : null}
              </>
            )}
          </section>

          <section id="applications" className="mypage-card">
            <h3>신청 이력</h3>
            {loading ? (
              <div className="mypage-empty">신청 이력을 불러오는 중입니다.</div>
            ) : (
              <div className="mypage-grid-two">
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>이벤트 신청</h4>
                  {eventRegistrations.length === 0 ? (
                    <div className="mypage-empty">내역이 없습니다.</div>
                  ) : (
                    <div className="mypage-list">
                      {eventRegistrations.map((item, idx) => (
                        <div className="mypage-item" key={item.applyId || item.id || idx}>
                          <div className="mypage-item-title">{item.eventTitle || item.eventName || "이벤트"}</div>
                          <div className="mypage-item-meta">
                            상태: {getStatusLabel(item.status)} | 신청일: {item.appliedAt || item.createdAt || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>프로그램 신청</h4>
                  {programApplies.length === 0 ? (
                    <div className="mypage-empty">내역이 없습니다.</div>
                  ) : (
                    <div className="mypage-list">
                      {programApplies.map((item, idx) => (
                        <div className="mypage-item" key={item.id || item.applyId || idx}>
                          <div className="mypage-item-title">{item.programTitle || item.title || "프로그램"}</div>
                          <div className="mypage-item-meta">
                            상태: {getStatusLabel(item.status)} | 신청일: {item.createdAt || item.appliedAt || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mypage-actions">
              <button className="btn-outline" type="button" onClick={() => navigate("/registration/applyhistory")}>
                신청 내역 페이지로 이동
              </button>
            </div>
          </section>

          <section id="payments" className="mypage-card">
            <h3>결제 이력</h3>
            <div className="mypage-empty">
              결제/환불 내역은 결제 이력 화면에서 상세하게 확인할 수 있습니다.
            </div>
            <div className="mypage-actions">
              <button className="btn-outline" type="button" onClick={() => navigate("/registration/paymenthistory")}>
                결제 이력 보기
              </button>
            </div>
          </section>

          <section id="notifications" className="mypage-card">
            <h3>알림 설정</h3>
            <label className="mypage-toggle">
              <input
                type="checkbox"
                checked={allowMarketing}
                onChange={handleToggleMarketing}
                disabled={settingsSaving}
              />
              <span>마케팅 알림 수신 동의</span>
            </label>
            <div className="mypage-actions">
              <button className="btn-outline" type="button" onClick={() => navigate("/notifications")}>
                알림함으로 이동
              </button>
            </div>
          </section>

          <section id="qr" className="mypage-card">
            <h3>QR</h3>
            <div className="mypage-empty">행사 입장을 위한 내 QR 코드를 확인할 수 있습니다.</div>
            <div className="mypage-actions">
              <button className="btn-primary" type="button" onClick={() => navigate("/mypage/qr")}>
                내 QR 확인
              </button>
            </div>
          </section>

          <section id="account" className="mypage-card">
            <h3>계정 관리</h3>
            <div className="mypage-empty">탈퇴 시 계정 정보와 연동 데이터가 삭제될 수 있습니다.</div>
            <div className="mypage-actions">
              <button className="btn-outline" type="button" onClick={() => navigate("/")}>
                홈으로
              </button>
              <button className="btn-danger" type="button" onClick={handleDeleteMe}>
                회원 탈퇴
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
