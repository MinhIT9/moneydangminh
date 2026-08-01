import sqlite3
from flask import Flask, render_template, redirect, session, request
from config import Config
from database import init_db, close_db
from auth import csrf_token, fail
from api import api

def create_app():
    app=Flask(__name__);app.config.from_object(Config);init_db(app);app.teardown_appcontext(close_db);app.register_blueprint(api)
    @app.before_request
    def csrf_guard():
        if session.get('must_change_password') and request.path.startswith('/api/') and request.path not in ('/api/auth/change-password','/api/auth/logout'):
            return fail('Bạn phải đổi mật khẩu trước khi tiếp tục',403)
        if request.method in ('POST','PUT','PATCH','DELETE') and request.path.startswith('/api/') and request.path not in ('/api/auth/login','/api/auth/register'):
            from auth import check_csrf
            if not check_csrf():return fail('Phiên bảo mật không hợp lệ, hãy tải lại trang',403)
    @app.get('/dashboard')
    @app.get('/transactions')
    @app.get('/methods')
    @app.get('/debts')
    @app.get('/settings')
    def index():return render_template('app.html',csrf_token=csrf_token()) if session.get('user_id') else redirect('/login')
    @app.get('/')
    @app.get('/landing')
    @app.get('/welcome')
    def landing_page():return render_template('landing.html')
    @app.get('/login')
    def login_page():return redirect('/dashboard') if session.get('user_id') else render_template('login.html')
    @app.get('/register')
    def register_page():return render_template('register.html')
    @app.errorhandler(sqlite3.Error)
    def db_error(_):return fail('Không thể xử lý dữ liệu lúc này',500)
    @app.errorhandler(ValueError)
    def validation_error(error):return fail(str(error),400)
    @app.errorhandler(404)
    def not_found(_):return fail('Không tìm thấy',404) if request.path.startswith('/api/') else ('Không tìm thấy',404)
    @app.after_request
    def cache(res):
        if request.path.startswith('/static/'):
            res.headers['Cache-Control']='no-cache' if app.debug else 'public,max-age=86400'
        res.headers['X-Content-Type-Options']='nosniff';res.headers['Referrer-Policy']='strict-origin-when-cross-origin';res.headers['X-Frame-Options']='DENY'
        return res
    return app
app=create_app()
if __name__=='__main__':app.run(host='127.0.0.1',port=5000,debug=True)
