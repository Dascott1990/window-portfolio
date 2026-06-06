from app import create_app
from app.scheduler import scheduler_service

app = create_app()

with app.app_context():
    scheduler_service.init_app(app)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=app.config.get("PORT", 5001),
        debug=app.config.get("DEBUG", False),
    )
