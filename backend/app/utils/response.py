from flask import jsonify


def success(data=None, message="Success", status=200):
    return jsonify({"success": True, "message": message, "data": data}), status


def created(data=None, message="Created"):
    return success(data, message, 201)


def no_content():
    return "", 204


def paginated(items, pagination, message="Success"):
    return jsonify({
        "success": True,
        "message": message,
        "data": items,
        "meta": {
            "total":       pagination.total,
            "page":        pagination.page,
            "per_page":    pagination.per_page,
            "total_pages": pagination.pages,
            "has_next":    pagination.has_next,
            "has_prev":    pagination.has_prev,
        },
    }), 200
