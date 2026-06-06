from app.repositories import MediaRepository
from app.storage import storage_service
from app.middleware.error_handlers import APIError


class MediaService:
    def __init__(self):
        self.repo    = MediaRepository()
        self.storage = storage_service

    def upload(self, file_obj, original_filename, media_type,
               caption=None, filter_name=None, overlay_data=None, metadata_json=None):
        if media_type == "image":
            if not self.storage.is_allowed_image(original_filename):
                raise APIError("File type not allowed", 400)
            stored = self.storage.save_image(file_obj, original_filename)
        elif media_type == "video":
            if not self.storage.is_allowed_video(original_filename):
                raise APIError("File type not allowed", 400)
            stored = self.storage.save_video(file_obj, original_filename)
        else:
            raise APIError("media_type must be 'image' or 'video'", 400)
        return self.repo.create(
            filename=stored["filename"], filepath=stored["filepath"],
            thumbnail=stored.get("thumbnail"), media_type=media_type,
            file_size=stored.get("file_size"), width=stored.get("width"),
            height=stored.get("height"), caption=caption,
            filter_name=filter_name, overlay_data=overlay_data,
            metadata_json=metadata_json,
        )

    def get_all(self, media_type=None, page=1, per_page=20):
        if media_type:
            return self.repo.get_by_type(media_type, page=page, per_page=per_page)
        return self.repo.get_all(page=page, per_page=per_page)

    def get_one(self, media_id):
        media = self.repo.get_by_id(media_id)
        if not media:
            raise APIError("Media not found", 404)
        return media

    def update_caption(self, media_id, caption):
        self.get_one(media_id)
        return self.repo.update(media_id, caption=caption)

    def delete(self, media_id):
        media = self.get_one(media_id)
        self.storage.delete_file(media.filepath)
        if media.thumbnail:
            self.storage.delete_file(media.thumbnail)
        return self.repo.soft_delete(media_id)
