import { useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { galleryApi } from "../../../../app/http/galleryApi";
import { toPublicAssetUrl } from "../../../../shared/utils/publicAssetUrl";

class CommunityUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  async upload() {
    const file = await this.loader.file;
    const res = await galleryApi.uploadImage(file);
    const publicPath = res?.data?.data?.publicPath ?? res?.data?.publicPath;

    if (!publicPath) {
      throw new Error("이미지 업로드 경로를 받지 못했습니다.");
    }

    return {
      default: toPublicAssetUrl(publicPath),
    };
  }

  abort() {}
}

function uploadPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
    new CommunityUploadAdapter(loader);
}

const WRAPPER_STYLE = `
  .community-editor .ck-editor__editable_inline {
    min-height: 260px;
  }

  .community-editor .ck.ck-editor__main > .ck-editor__editable {
    border-radius: 0 0 10px 10px;
  }

  .community-editor .ck.ck-toolbar {
    border-radius: 10px 10px 0 0;
  }
`;

export default function CommunityRichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력해 주세요.",
  height = 260,
}) {
  const config = useMemo(
    () => ({
      extraPlugins: [uploadPlugin],
      placeholder,
      toolbar: [
        "heading",
        "|",
        "bold",
        "italic",
        "underline",
        "link",
        "bulletedList",
        "numberedList",
        "blockQuote",
        "|",
        "imageUpload",
        "insertTable",
        "undo",
        "redo",
      ],
      image: {
        toolbar: ["imageTextAlternative", "imageStyle:inline", "imageStyle:block"],
      },
    }),
    [placeholder],
  );

  return (
    <div className="community-editor">
      <style>{`${WRAPPER_STYLE}
        .community-editor .ck-editor__editable_inline { min-height: ${height}px; }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value || ""}
        onChange={(_, editor) => onChange?.(editor.getData())}
      />
    </div>
  );
}
