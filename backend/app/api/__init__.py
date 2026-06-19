from .camera         import camera_bp
from .media          import media_bp
from .events         import events_bp
from .contacts       import contacts_bp
from .projects       import projects_bp
from .transactions   import transactions_bp
from .health_records import health_bp
from .files          import files_bp
from .ai             import ai_bp
from .wallet         import wallet_bp


def register_blueprints(app):
    prefix = "/api/v1"
    app.register_blueprint(camera_bp,       url_prefix=f"{prefix}/camera")
    app.register_blueprint(media_bp,        url_prefix=f"{prefix}/media")
    app.register_blueprint(events_bp,       url_prefix=f"{prefix}/events")
    app.register_blueprint(contacts_bp,     url_prefix=f"{prefix}/contacts")
    app.register_blueprint(projects_bp,     url_prefix=f"{prefix}/projects")
    app.register_blueprint(transactions_bp, url_prefix=f"{prefix}/transactions")
    app.register_blueprint(health_bp,       url_prefix=f"{prefix}/health")
    app.register_blueprint(files_bp,        url_prefix=f"{prefix}/files")
    app.register_blueprint(ai_bp,           url_prefix=f"{prefix}/ai")
    app.register_blueprint(wallet_bp,       url_prefix=f"{prefix}/wallet")
