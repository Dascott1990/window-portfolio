from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS

from config import get_config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()


def create_app(config_class=None):
    app = Flask(__name__, instance_relative_config=False)
    cfg = config_class or get_config()
    app.config.from_object(cfg)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    CORS(
        app,
        origins=app.config["ALLOWED_ORIGINS"],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    from app.api import register_blueprints
    register_blueprints(app)

    from app.middleware.error_handlers import register_error_handlers
    from app.middleware.request_hooks import register_request_hooks
    register_error_handlers(app)
    register_request_hooks(app)

    @app.shell_context_processor
    def make_shell_context():
        return {"db": db, "app": app}

    @app.get("/health")
    def health():
        return {"status": "ok", "env": app.config.get("FLASK_ENV", "development")}

    return app
