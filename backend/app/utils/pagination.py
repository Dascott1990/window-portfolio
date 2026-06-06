from flask import request


def paginate_result(query_func, *args, **kwargs):
    page     = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)
    return query_func(*args, page=page, per_page=per_page, **kwargs)
