import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import { resolveErrorMessage, toFieldMessageMap } from "../../../features/shared/forms/formError";
import {
  mypageCardStyle,
  mypageDangerButtonStyle,
  mypageInputStyle,
  mypageLabelStyle,
  mypageOutlineButtonStyle,
  mypagePageStyle,
  mypagePrimaryButtonStyle,
  mypageTitleStyle,
} from "../../../features/shared/ui/mypageStyles";

const PET_BREEDS = ["DOG", "CAT", "OTHER"];

export default function MypagePetEditor() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const isEditMode = useMemo(() => Boolean(petId), [petId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    petName: "",
    petBreed: "DOG",
    petAge: "",
  });

  useEffect(() => {
    if (!isEditMode) return undefined;

    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setGlobalError("");
        const pets = await mypageApi.getMyPets();
        const target = (pets || []).find((pet) => String(pet.petId) === String(petId));
        if (!target) {
          throw new Error("반려동물 정보를 찾을 수 없습니다.");
        }
        if (!mounted) return;
        setForm({
          petName: target.petName || "",
          petBreed: String(target.petBreed || "DOG").toUpperCase(),
          petAge: String(target.petAge ?? ""),
        });
      } catch (error) {
        if (!mounted) return;
        setGlobalError(resolveErrorMessage(error, "반려동물 정보를 불러오지 못했습니다."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [isEditMode, petId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setGlobalError("");
      setFieldErrors({});

      const payload = {
        petName: (form.petName || "").trim(),
        petBreed: String(form.petBreed || "DOG").toUpperCase(),
        petAge: Number(form.petAge),
      };

      if (isEditMode) {
        await mypageApi.updatePet(Number(petId), payload);
      } else {
        await mypageApi.createPet(payload);
      }
      navigate("/mypage");
    } catch (error) {
      setFieldErrors(toFieldMessageMap(error));
      setGlobalError(resolveErrorMessage(error, "반려동물 저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    const shouldDelete = window.confirm("반려동물을 삭제하시겠습니까?");
    if (!shouldDelete) return;

    try {
      setDeleting(true);
      setGlobalError("");
      await mypageApi.deletePet(Number(petId));
      navigate("/mypage");
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "반려동물 삭제에 실패했습니다."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={mypagePageStyle}>
      <div style={{ ...mypageCardStyle, maxWidth: 720, margin: "120px auto 80px" }}>
        <h2 style={mypageTitleStyle}>
          {isEditMode ? "반려동물 수정" : "반려동물 등록"}
        </h2>

        {globalError ? (
          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{globalError}</div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="petName" style={mypageLabelStyle}>
              이름
            </label>
            <input
              id="petName"
              name="petName"
              value={form.petName}
              onChange={handleChange}
              style={mypageInputStyle}
              maxLength={100}
              disabled={loading || saving || deleting}
            />
            {fieldErrors.petName ? (
              <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{fieldErrors.petName}</div>
            ) : null}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="petBreed" style={mypageLabelStyle}>
              품종 코드
            </label>
            <select
              id="petBreed"
              name="petBreed"
              value={form.petBreed}
              onChange={handleChange}
              style={mypageInputStyle}
              disabled={loading || saving || deleting}
            >
              {PET_BREEDS.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>
            {fieldErrors.petBreed ? (
              <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{fieldErrors.petBreed}</div>
            ) : null}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="petAge" style={mypageLabelStyle}>
              나이(0~100)
            </label>
            <input
              id="petAge"
              name="petAge"
              type="number"
              min={0}
              max={100}
              value={form.petAge}
              onChange={handleChange}
              style={mypageInputStyle}
              disabled={loading || saving || deleting}
            />
            {fieldErrors.petAge ? (
              <div style={{ marginTop: 6, color: "#b91c1c", fontSize: 12 }}>{fieldErrors.petAge}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading || saving || deleting}
              style={{ ...mypagePrimaryButtonStyle, cursor: loading || saving || deleting ? "not-allowed" : "pointer" }}
            >
              {isEditMode ? "수정 저장" : "등록"}
            </button>

            {isEditMode ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || saving || deleting}
                style={{ ...mypageDangerButtonStyle, cursor: loading || saving || deleting ? "not-allowed" : "pointer" }}
              >
                삭제
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => navigate("/mypage")}
              disabled={loading || saving || deleting}
              style={{ ...mypageOutlineButtonStyle, cursor: loading || saving || deleting ? "not-allowed" : "pointer" }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
