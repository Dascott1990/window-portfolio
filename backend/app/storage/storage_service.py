import os
import uuid
from pathlib import Path
from datetime import datetime
from flask import current_app
from PIL import Image as PILImage


class StorageService:
    def _upload_root(self):
        return Path(current_app.root_path).parent / current_app.config["UPLOAD_FOLDER"]

    def _abs(self, relative_path):
        return self._upload_root() / relative_path

    def _ensure_dir(self, path: Path):
        path.mkdir(parents=True, exist_ok=True)

    def _unique_filename(self, original: str) -> str:
        ext = Path(original).suffix.lower()
        return f"{uuid.uuid4().hex}{ext}"

    def save_image(self, file_obj, original_filename: str) -> dict:
        filename  = self._unique_filename(original_filename)
        today     = datetime.utcnow().strftime("%Y/%m/%d")
        rel_dir   = Path("images") / today
        thumb_dir = Path("thumbnails") / today
        abs_dir   = self._upload_root() / rel_dir
        abs_thumb = self._upload_root() / thumb_dir
        self._ensure_dir(abs_dir)
        self._ensure_dir(abs_thumb)
        filepath = abs_dir / filename
        file_obj.save(str(filepath))
        with PILImage.open(str(filepath)) as img:
            width, height = img.size
            file_size = filepath.stat().st_size
            img.thumbnail((400, 400))
            thumb_filename = f"thumb_{filename.replace(Path(filename).suffix, '.jpg')}"
            thumb_path = abs_thumb / thumb_filename
            img.convert("RGB").save(str(thumb_path), "JPEG", quality=85)
        return {
            "filename":  filename,
            "filepath":  str(rel_dir / filename),
            "thumbnail": str(thumb_dir / thumb_filename),
            "width":     width,
            "height":    height,
            "file_size": file_size,
        }

    def save_video(self, file_obj, original_filename: str) -> dict:
        filename = self._unique_filename(original_filename)
        today    = datetime.utcnow().strftime("%Y/%m/%d")
        rel_dir  = Path("videos") / today
        abs_dir  = self._upload_root() / rel_dir
        self._ensure_dir(abs_dir)
        filepath = abs_dir / filename
        file_obj.save(str(filepath))
        return {
            "filename":  filename,
            "filepath":  str(rel_dir / filename),
            "thumbnail": None,
            "file_size": filepath.stat().st_size,
        }

    def delete_file(self, relative_path: str) -> bool:
        abs_path = self._abs(relative_path)
        if abs_path.exists():
            abs_path.unlink()
            return True
        return False

    def get_absolute_path(self, relative_path: str) -> str:
        return str(self._abs(relative_path))

    def file_exists(self, relative_path: str) -> bool:
        return self._abs(relative_path).exists()

    def is_allowed_image(self, filename: str) -> bool:
        ext = Path(filename).suffix.lstrip(".").lower()
        return ext in current_app.config["ALLOWED_IMAGE_EXTENSIONS"]

    def is_allowed_video(self, filename: str) -> bool:
        ext = Path(filename).suffix.lstrip(".").lower()
        return ext in current_app.config["ALLOWED_VIDEO_EXTENSIONS"]
