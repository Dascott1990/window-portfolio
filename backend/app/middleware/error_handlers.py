from flask import jsonify
from werkzeug.exceptions import HTTPException


class APIError(Exception):
    def __init__(self, message: str, status_code: int = 400, payload: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(err):
        return jsonify({"success": False, "message": err.message, **err.payload}), err.status_code

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify({"success": False, "message": err.description}), err.code

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"success": False, "message": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_err):
        return jsonify({"success": False, "message": "Method not allowed"}), 405

    @app.errorhandler(413)
    def too_large(_err):
        return jsonify({"success": False, "message": "File too large"}), 413

    @app.errorhandler(500)
    def server_error(err):
        app.logger.error(f"500: {err}")
        return jsonify({"success": False, "message": "Internal server error"}), 500
