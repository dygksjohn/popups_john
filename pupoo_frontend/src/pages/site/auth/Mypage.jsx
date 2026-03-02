import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { mypageApi } from "./api/mypageApi";

const styles = `
  .signup-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 140px 20px 80px;
    color: #333;
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

  .submit-wrap {
    text-align: center;
    margin-top: 20px;
  }

  .btn-submit {
    height: 50px;
    padding: 0 40px;
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
    padding: 0 40px;
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

  .btn-danger {
    height: 50px;
    padding: 0 40px;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin: 0 6px;
    transition: background 0.2s;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  .btn-inline {
    height: 42px;
    padding: 0 16px;
    background: #1a9ac9;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-inline:hover {
    background: #1588b0;
  }

  .btn-inline:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .inline-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .status-text {
    font-size: 13px;
    color: #666;
  }

  .status-banner {
    margin-top: -26px;
    margin-bottom: 26px;
  }

  .error-text {
    color: #e11d48;
    margin-top: -20px;
    margin-bottom: 20px;
    font-size: 13px;
    white-space: pre-line;
  }

  .list-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .list-item {
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    padding: 12px;
    background: #fff;
  }

  .list-item-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .list-item-meta {
    margin-top: 6px;
    font-size: 12px;
    color: #666;
  }

  .form-table-bordered {
    border-top: 2px solid #333;
  }

  .section-title-inline {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

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

const PET_BREEDS = ["DOG", "CAT", "OTHER"];
const PET_WEIGHTS = ["XS", "S", "M", "L", "XL"];

export default function Mypage() {
  const navigate = useNavigate();
  const { isAuthed, isBootstrapped, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingPet, setAddingPet] = useState(false);
  const [error, setError] = useState("");
  const [petFormError, setPetFormError] = useState("");

  const [me, setMe] = useState(null);
  const [pets, setPets] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [programApplies, setProgramApplies] = useState([]);

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
      const [meRes, petsRes, eventRes, programRes] = await Promise.all([
        mypageApi.getMe(),
        mypageApi.getMyPets(),
        mypageApi.getMyEventRegistrations({ page: 0, size: 20 }),
        mypageApi.getMyProgramApplies({ page: 0, size: 20 }),
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
    ],
    [me],
  );

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

  const renderLoadingRow = (message) => (
    <tr>
      <th>상태</th>
      <td className="status-text">{message}</td>
    </tr>
  );

  return (
    <>
      <style>{styles}</style>

      <main className="signup-wrap">
        <h2 className="signup-title">마이페이지</h2>

        <div className="status-text status-banner">
          현재 단계: <b>프로필 확인/수정</b>
        </div>

        <p className="section-title">프로필 요약</p>
        <table className="form-table form-table-bordered">
          <tbody>
            {loading && renderLoadingRow("프로필 정보를 불러오는 중입니다.")}
            {!loading &&
              profileSummary.map((item) => (
                <tr key={item.label}>
                  <th>{item.label}</th>
                  <td>{item.value}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="section-header">
          <span className="section-title section-title-inline">
            기본정보 수정
          </span>
          <span className="required-note">
            <span>*</span> 변경 가능한 항목만 수정됩니다.
          </span>
        </div>
        <table className="form-table form-table-bordered">
          <tbody>
            {loading && renderLoadingRow("수정 폼을 준비하는 중입니다.")}
            {!loading && (
              <>
                <tr>
                  <th>닉네임</th>
                  <td>
                    <input
                      className="form-input"
                      name="nickname"
                      value={editForm.nickname}
                      onChange={handleEditInput}
                      disabled={saving}
                    />
                  </td>
                </tr>
                <tr>
                  <th>연락처</th>
                  <td>
                    <input
                      className="form-input"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditInput}
                      disabled={saving}
                    />
                  </td>
                </tr>
                <tr>
                  <th>저장</th>
                  <td>
                    <button className="btn-submit" type="button" onClick={handleSaveBasicInfo} disabled={saving}>
                      {saving ? "저장 중..." : "기본정보 저장"}
                    </button>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <p className="section-title">반려동물</p>
        <table className="form-table form-table-bordered">
          <tbody>
            {loading && renderLoadingRow("반려동물 정보를 불러오는 중입니다.")}
            {!loading && pets.length === 0 && (
              <tr>
                <th>목록</th>
                <td className="status-text">등록된 반려동물이 없습니다.</td>
              </tr>
            )}
            {!loading && pets.length > 0 && (
              <tr>
                <th>목록</th>
                <td>
                  <div className="list-stack">
                    {pets.map((pet, idx) => {
                      const petId = pet?.petId ?? pet?.id ?? idx;
                      const petName = pet?.petName ?? pet?.name ?? "-";
                      const petBreed = pet?.petBreed ?? pet?.type ?? "-";
                      const petAge = pet?.petAge ?? pet?.age ?? "-";
                      const petWeight = pet?.petWeight ?? "-";
                      return (
                        <div className="list-item" key={petId}>
                          <div className="list-item-title">{petName}</div>
                          <div className="list-item-meta">
                            종류: {petBreed} | 나이: {petAge} | 무게: {petWeight}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <th>추가</th>
              <td>
                <div className="inline-actions">
                  <input
                    className="form-input"
                    name="petName"
                    placeholder="이름"
                    value={petForm.petName}
                    onChange={handlePetInput}
                    disabled={addingPet}
                    style={{ maxWidth: 180 }}
                  />
                  <select
                    className="form-input"
                    name="petBreed"
                    value={petForm.petBreed}
                    onChange={handlePetInput}
                    disabled={addingPet}
                    style={{ maxWidth: 140 }}
                  >
                    {PET_BREEDS.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    name="petAge"
                    placeholder="나이"
                    value={petForm.petAge}
                    onChange={handlePetInput}
                    disabled={addingPet}
                    style={{ maxWidth: 120 }}
                  />
                  <select
                    className="form-input"
                    name="petWeight"
                    value={petForm.petWeight}
                    onChange={handlePetInput}
                    disabled={addingPet}
                    style={{ maxWidth: 120 }}
                  >
                    {PET_WEIGHTS.map((weight) => (
                      <option key={weight} value={weight}>
                        {weight}
                      </option>
                    ))}
                  </select>
                  <button className="btn-inline" type="button" onClick={handleAddPet} disabled={addingPet}>
                    {addingPet ? "추가 중..." : "반려동물 추가"}
                  </button>
                </div>
                {petFormError && (
                  <div className="status-text" style={{ color: "#e11d48", marginTop: 8 }}>
                    {petFormError}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="section-title">내 이벤트 신청 내역</p>
        <table className="form-table form-table-bordered">
          <tbody>
            {loading && renderLoadingRow("이벤트 신청 내역을 불러오는 중입니다.")}
            {!loading && eventRegistrations.length === 0 && (
              <tr>
                <th>내역</th>
                <td className="status-text">이벤트 신청 내역이 없습니다.</td>
              </tr>
            )}
            {!loading && eventRegistrations.length > 0 && (
              <tr>
                <th>내역</th>
                <td>
                  <div className="list-stack">
                    {eventRegistrations.map((item, idx) => (
                      <div className="list-item" key={item.applyId || item.id || idx}>
                        <div className="list-item-title">{item.eventTitle || item.eventName || "이벤트"}</div>
                        <div className="list-item-meta">
                          상태: {getStatusLabel(item.status)} | 신청일: {item.appliedAt || item.createdAt || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="section-title">내 프로그램 신청 내역</p>
        <table className="form-table form-table-bordered">
          <tbody>
            {loading && renderLoadingRow("프로그램 신청 내역을 불러오는 중입니다.")}
            {!loading && programApplies.length === 0 && (
              <tr>
                <th>내역</th>
                <td className="status-text">프로그램 신청 내역이 없습니다.</td>
              </tr>
            )}
            {!loading && programApplies.length > 0 && (
              <tr>
                <th>내역</th>
                <td>
                  <div className="list-stack">
                    {programApplies.map((item, idx) => (
                      <div className="list-item" key={item.id || item.applyId || idx}>
                        <div className="list-item-title">{item.programTitle || item.title || "프로그램"}</div>
                        <div className="list-item-meta">
                          상태: {getStatusLabel(item.status)} | 신청일: {item.createdAt || item.appliedAt || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="section-title">내 QR 확인</p>
        <table className="form-table form-table-bordered">
          <tbody>
            <tr>
              <th>QR</th>
              <td>
                <button className="btn-submit" type="button" onClick={() => navigate("/mypage/qr")}>
                  내 QR 확인
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {error && <div className="error-text">{error}</div>}

        <div className="submit-wrap">
          <button className="btn-cancel" type="button" onClick={() => navigate("/")}>
            홈으로
          </button>
          <button className="btn-danger" type="button" onClick={handleDeleteMe}>
            회원 탈퇴
          </button>
        </div>
      </main>
    </>
  );
}

