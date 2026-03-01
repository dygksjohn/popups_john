import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilePicker from "../../../features/storage/components/FilePicker";
import { useUploader } from "../../../features/storage/hooks/useUploader";
import { resolveErrorMessage } from "../../../features/shared/forms/formError";
import {
  mypageCardStyle,
  mypageInputStyle,
  mypageLabelStyle,
  mypageOutlineButtonStyle,
  mypagePageStyle,
  mypagePrimaryButtonStyle,
  mypageTitleStyle,
} from "../../../features/shared/ui/mypageStyles";

export default function MypageStorageUpload() {
  const navigate = useNavigate();
  const uploader = useUploader();
  const [contentId, setContentId] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [uploaded, setUploaded] = useState([]);

  const handleUpload = async () => {
    try {
      setGlobalError("");
      const id = Number(contentId);
      if (!id || id < 1) {
        throw new Error("contentId를 1 이상의 숫자로 입력하세요.");
      }
      const result = await uploader.uploadAll({
        targetType: "POST",
        contentId: id,
      });
      setUploaded(result || []);
    } catch (error) {
      setGlobalError(resolveErrorMessage(error, "파일 업로드에 실패했습니다."));
    }
  };

  return (
    <div style={mypagePageStyle}>
      <div style={{ ...mypageCardStyle, maxWidth: 840, margin: "120px auto 80px" }}>
        <h2 style={mypageTitleStyle}>파일 업로드</h2>
        {globalError ? (
          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{globalError}</div>
        ) : null}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <label htmlFor="contentId" style={mypageLabelStyle}>
            contentId
          </label>
          <input
            id="contentId"
            type="number"
            min={1}
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            style={mypageInputStyle}
            placeholder="예: 1"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploader.isUploading}
            style={{ ...mypagePrimaryButtonStyle, cursor: uploader.isUploading ? "not-allowed" : "pointer" }}
          >
            {uploader.isUploading ? "업로드 중..." : "업로드 실행"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/mypage")}
            style={mypageOutlineButtonStyle}
          >
            마이페이지로
          </button>
        </div>

        <FilePicker
          items={uploader.items}
          onFilesAdded={uploader.addFiles}
          onRemove={uploader.removeFile}
          accept={uploader.policy.allowedMimeTypes.join(",")}
          multiple
          disabled={uploader.isUploading}
        />

        {uploaded.length ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>업로드 결과</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {uploaded.map((file) => (
                <li key={file.fileId} style={{ marginBottom: 6, fontSize: 13 }}>
                  fileId: {file.fileId}, path: {file.publicPath}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
