import secrets
from functools import wraps
from flask import session, request, jsonify


def ok(data=None, status=200):
    return jsonify(success=True, data={} if data is None else data), status


def fail(message, status=400):
    return jsonify(success=False, message=message), status


def login_required(fn):
    @wraps(fn)
    def wrapped(*a, **kw):
        if not session.get("user_id"):
            return fail("Bạn cần đăng nhập", 401)
        return fn(*a, **kw)

    return wrapped


def root_required(fn):
    @wraps(fn)
    def wrapped(*a, **kw):
        if not session.get("user_id"):
            return fail("Bạn cần đăng nhập", 401)
        if session.get("role") != "root":
            return fail("Không có quyền truy cập", 403)
        return fn(*a, **kw)

    return wrapped


def csrf_token():
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe(32)
    return session["csrf_token"]


def check_csrf():
    return secrets.compare_digest(
        session.get("csrf_token", ""),
        request.headers.get("X-CSRF-Token", "") or request.form.get("csrf_token", ""),
    )
