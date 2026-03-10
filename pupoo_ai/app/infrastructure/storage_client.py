from pathlib import Path

from pupoo_ai.app.core.config import settings


class LocalStorageClient:
    def __init__(
        self,
        root_dir: str | None = None,
        mount_path: str | None = None,
        public_base_url: str | None = None,
    ) -> None:
        self.root_dir = Path(root_dir or settings.storage_root_dir)
        self.mount_path = mount_path or settings.storage_mount_path
        self.public_base_url = public_base_url or settings.storage_public_base_url

    def save_poster(self, *, filename: str, content: bytes) -> str:
        poster_dir = self.root_dir / "posters"
        poster_dir.mkdir(parents=True, exist_ok=True)

        output_path = poster_dir / filename
        output_path.write_bytes(content)

        if self.public_base_url:
            return f"{self.public_base_url.rstrip('/')}/posters/{filename}"

        return f"{self.mount_path.rstrip('/')}/posters/{filename}"
