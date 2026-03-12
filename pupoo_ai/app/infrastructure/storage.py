from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class StorageReference:
    key: str
    internal_path: str | None = None


class StorageAdapter(Protocol):
    def store_generated_file(
        self,
        *,
        content: bytes,
        content_type: str,
        key_hint: str | None = None,
    ) -> StorageReference:
        ...


# TODO(cloud-native-step-01): Route future AI-generated file save/upload work
# through a concrete adapter in this module. The AI layer should return a
# storage key or internal reference only. Public URL resolution stays in the
# backend or storage boundary.
