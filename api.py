import re, sqlite3
from datetime import date, datetime
from flask import Blueprint, request, session, current_app, send_file
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_db, seed_user, connect
from auth import ok, fail, login_required, root_required, csrf_token

api=Blueprint('api',__name__,url_prefix='/api')
EMAIL=re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
TYPES={'income','expense','debt_payment','loan','adjustment'}
def body(): return request.get_json(silent=True) or {}
def integer(v,name='Số tiền',positive=True):
    if isinstance(v,bool): raise ValueError(f'{name} không hợp lệ')
    try: n=int(v)
    except: raise ValueError(f'{name} phải là số nguyên')
    if (positive and n<=0) or n<0: raise ValueError(f'{name} không hợp lệ')
    return n
def owned(table, ident): return get_db().execute(f'SELECT * FROM {table} WHERE id=? AND user_id=?',(ident,session['user_id'])).fetchone()
def rows(rs): return [dict(x) for x in rs]
def balance_sql(alias='a'):
    return f"{alias}.opening_balance+COALESCE((SELECT SUM(CASE WHEN type IN('income','loan') THEN amount WHEN type IN('expense','debt_payment') THEN -amount ELSE amount*adjustment_sign END) FROM transactions t WHERE t.account_id={alias}.id),0)+COALESCE((SELECT SUM(CASE WHEN tr.to_account_id={alias}.id THEN tr.amount ELSE -tr.amount END) FROM transfers tr WHERE tr.from_account_id={alias}.id OR tr.to_account_id={alias}.id),0)"

@api.post('/auth/login')
def login():
    d=body(); u=get_db().execute('SELECT * FROM users WHERE email=?',(str(d.get('email','')).strip(),)).fetchone()
    if not u or not check_password_hash(u['password_hash'],str(d.get('password',''))): return fail('Email hoặc mật khẩu không đúng',401)
    if u['is_locked']: return fail('Tài khoản đã bị khóa',403)
    session.clear(); session.update(user_id=u['id'],email=u['email'],role=u['role'],must_change_password=bool(u['must_change_password'])); token=csrf_token()
    return ok({'csrf_token':token,'must_change_password':bool(u['must_change_password'])})
@api.post('/auth/logout')
@login_required
def logout(): session.clear(); return ok()
@api.post('/auth/register')
def register():
    db=get_db(); enabled=db.execute("SELECT value FROM settings WHERE key='registration_enabled'").fetchone()['value']=='1'
    if not enabled:return fail('Đăng ký đang đóng',403)
    d=body(); email=str(d.get('email','')).strip().lower(); password=str(d.get('password',''))
    if not EMAIL.match(email) or len(password)<8:return fail('Email không hợp lệ hoặc mật khẩu dưới 8 ký tự')
    try:
        cur=db.execute('INSERT INTO users(email,password_hash) VALUES(?,?)',(email,generate_password_hash(password))); seed_user(db,cur.lastrowid); db.commit()
    except sqlite3.IntegrityError:return fail('Email đã tồn tại',409)
    return ok({},201)
@api.post('/auth/change-password')
@login_required
def change_password():
    d=body(); db=get_db(); u=db.execute('SELECT * FROM users WHERE id=?',(session['user_id'],)).fetchone(); new=str(d.get('new_password',''))
    if not check_password_hash(u['password_hash'],str(d.get('current_password',''))):return fail('Mật khẩu hiện tại không đúng')
    if len(new)<8:return fail('Mật khẩu mới cần ít nhất 8 ký tự')
    db.execute('UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?',(generate_password_hash(new),u['id']));db.commit();session['must_change_password']=False;return ok()

@api.get('/categories')
@login_required
def categories(): return ok(rows(get_db().execute('SELECT * FROM categories WHERE user_id=? ORDER BY kind,name',(session['user_id'],))))

@api.get('/accounts')
@login_required
def accounts():
    q=f'SELECT a.*, {balance_sql()} balance FROM accounts a WHERE user_id=? ORDER BY is_hidden,name'
    return ok(rows(get_db().execute(q,(session['user_id'],))))
@api.post('/accounts')
@login_required
def add_account():
    d=body(); name=str(d.get('name','')).strip()
    if not name:return fail('Tên tài khoản là bắt buộc')
    cur=get_db().execute('INSERT INTO accounts(user_id,name,opening_balance) VALUES(?,?,?)',(session['user_id'],name,integer(d.get('opening_balance',0),'Số dư',False)));get_db().commit();return ok({'id':cur.lastrowid},201)
@api.put('/accounts/<int:i>')
@login_required
def edit_account(i):
    if not owned('accounts',i):return fail('Không tìm thấy',404)
    d=body(); name=str(d.get('name','')).strip()
    if not name:return fail('Tên tài khoản là bắt buộc')
    get_db().execute('UPDATE accounts SET name=?,is_hidden=? WHERE id=?',(name,1 if d.get('is_hidden') else 0,i));get_db().commit();return ok()

@api.get('/transactions')
@login_required
def transactions():
    where=['t.user_id=?']; args=[session['user_id']]
    for key,col in [('month','substr(t.occurred_on,1,7)'),('type','t.type'),('category_id','t.category_id'),('account_id','t.account_id')]:
        if request.args.get(key):where.append(col+'=?');args.append(request.args[key])
    if request.args.get('q'):where.append('(t.note LIKE ? OR c.name LIKE ?)');s='%'+request.args['q']+'%';args += [s,s]
    q='SELECT t.*,a.name account_name,c.name category_name FROM transactions t JOIN accounts a ON a.id=t.account_id LEFT JOIN categories c ON c.id=t.category_id WHERE '+' AND '.join(where)+' ORDER BY occurred_on DESC,id DESC LIMIT 500'
    return ok(rows(get_db().execute(q,args)))
def validate_tx(d):
    typ=d.get('type'); amount=integer(d.get('amount')); occurred=str(d.get('occurred_on',date.today().isoformat()))
    if typ not in TYPES:raise ValueError('Loại giao dịch không hợp lệ')
    date.fromisoformat(occurred)
    if not owned('accounts',integer(d.get('account_id'),'Tài khoản')):raise ValueError('Tài khoản không hợp lệ')
    cat=d.get('category_id') or None
    if cat and not owned('categories',integer(cat,'Danh mục')):raise ValueError('Danh mục không hợp lệ')
    return typ,amount,occurred,cat
@api.post('/transactions')
@login_required
def add_tx():
    d=body(); typ,amount,day,cat=validate_tx(d); sign=-1 if d.get('adjustment_sign')==-1 else 1
    cur=get_db().execute('INSERT INTO transactions(user_id,account_id,category_id,type,amount,adjustment_sign,note,occurred_on) VALUES(?,?,?,?,?,?,?,?)',(session['user_id'],d['account_id'],cat,typ,amount,sign,str(d.get('note',''))[:300],day));get_db().commit();return ok({'id':cur.lastrowid},201)
@api.put('/transactions/<int:i>')
@login_required
def edit_tx(i):
    if not owned('transactions',i):return fail('Không tìm thấy',404)
    d=body(); typ,amount,day,cat=validate_tx(d); sign=-1 if d.get('adjustment_sign')==-1 else 1
    get_db().execute('UPDATE transactions SET account_id=?,category_id=?,type=?,amount=?,adjustment_sign=?,note=?,occurred_on=? WHERE id=?',(d['account_id'],cat,typ,amount,sign,str(d.get('note',''))[:300],day,i));get_db().commit();return ok()
@api.delete('/transactions/<int:i>')
@login_required
def delete_tx(i):
    tx=owned('transactions',i)
    if not tx:return fail('Không tìm thấy',404)
    if tx['debt_id']:return fail('Hãy quản lý giao dịch này từ khoản nợ')
    get_db().execute('DELETE FROM transactions WHERE id=?',(i,));get_db().commit();return ok()

@api.post('/transfers')
@login_required
def transfer():
    d=body(); fr=integer(d.get('from_account_id'));to=integer(d.get('to_account_id'));amount=integer(d.get('amount'))
    if fr==to or not owned('accounts',fr) or not owned('accounts',to):return fail('Tài khoản chuyển không hợp lệ')
    bal=get_db().execute(f'SELECT {balance_sql()} b FROM accounts a WHERE a.id=?',(fr,)).fetchone()['b']
    if bal<amount:return fail('Số dư không đủ')
    cur=get_db().execute('INSERT INTO transfers(user_id,from_account_id,to_account_id,amount,note,occurred_on) VALUES(?,?,?,?,?,?)',(session['user_id'],fr,to,amount,str(d.get('note',''))[:300],d.get('occurred_on',date.today().isoformat())));get_db().commit();return ok({'id':cur.lastrowid},201)

@api.route('/debts',methods=['GET','POST'])
@login_required
def debts():
    db=get_db()
    if request.method=='GET':return ok(rows(db.execute('SELECT * FROM debts WHERE user_id=? ORDER BY status,due_date',(session['user_id'],))))
    d=body();total=integer(d.get('total_amount')); monthly=integer(d.get('monthly_due',0),'Khoản trả tháng',False); due=d.get('due_date') or None
    if due:date.fromisoformat(due)
    cur=db.execute('INSERT INTO debts(user_id,name,total_amount,remaining_amount,monthly_due,due_date,priority,note) VALUES(?,?,?,?,?,?,?,?)',(session['user_id'],str(d.get('name','')).strip(),total,total,monthly,due,d.get('priority','medium'),str(d.get('note',''))[:300]));db.commit();return ok({'id':cur.lastrowid},201)
@api.post('/debts/<int:i>/payments')
@login_required
def pay_debt(i):
    debt=owned('debts',i); d=body()
    if not debt:return fail('Không tìm thấy',404)
    amount=integer(d.get('amount')); account=integer(d.get('account_id')); day=d.get('paid_on',date.today().isoformat())
    if amount>debt['remaining_amount']:return fail('Số tiền vượt quá dư nợ')
    if not owned('accounts',account):return fail('Tài khoản không hợp lệ')
    db=get_db(); bal=db.execute(f'SELECT {balance_sql()} b FROM accounts a WHERE a.id=?',(account,)).fetchone()['b']
    if bal<amount:return fail('Số dư không đủ')
    try:
        db.execute('BEGIN'); cur=db.execute("INSERT INTO transactions(user_id,account_id,type,amount,note,occurred_on,debt_id) VALUES(?,?,?,?,?,?,?)",(session['user_id'],account,'debt_payment',amount,'Trả nợ: '+debt['name'],day,i));db.execute('INSERT INTO debt_payments(user_id,debt_id,account_id,transaction_id,amount,paid_on) VALUES(?,?,?,?,?,?)',(session['user_id'],i,account,cur.lastrowid,amount,day));remain=debt['remaining_amount']-amount;db.execute('UPDATE debts SET remaining_amount=?,status=? WHERE id=?',(remain,'paid' if remain==0 else 'active',i));db.commit()
    except:db.rollback();raise
    return ok()

@api.get('/dashboard')
@login_required
def dashboard():
    month=request.args.get('month',date.today().strftime('%Y-%m'));db=get_db();uid=session['user_id']; today=date.today().isoformat()
    sums=db.execute("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) expense,COALESCE(SUM(CASE WHEN type='debt_payment' THEN amount END),0) paid,COALESCE(SUM(CASE WHEN type='income' AND occurred_on=? THEN amount END),0) today_income,COALESCE(SUM(CASE WHEN type='expense' AND occurred_on=? THEN amount END),0) today_expense FROM transactions WHERE user_id=? AND substr(occurred_on,1,7)=?",(today,today,uid,month)).fetchone()
    daily=rows(db.execute("SELECT occurred_on day,SUM(CASE WHEN type='income' THEN amount ELSE 0 END) income,SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) expense FROM transactions WHERE user_id=? AND substr(occurred_on,1,7)=? GROUP BY occurred_on ORDER BY occurred_on",(uid,month)))
    bycat=rows(db.execute("SELECT COALESCE(c.name,'Khác') label,SUM(t.amount) value,t.type FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=? AND substr(t.occurred_on,1,7)=? AND t.type IN('income','expense') GROUP BY t.type,c.name",(uid,month)))
    accts=rows(db.execute(f'SELECT a.id,a.name,{balance_sql()} balance FROM accounts a WHERE user_id=? AND is_hidden=0',(uid,)))
    recent=rows(db.execute('SELECT t.*,a.name account_name,c.name category_name FROM transactions t JOIN accounts a ON a.id=t.account_id LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=? ORDER BY occurred_on DESC,t.id DESC LIMIT 8',(uid,)))
    due=db.execute("SELECT COALESCE(SUM(monthly_due),0) due,COALESCE(SUM(remaining_amount),0) remaining FROM debts WHERE user_id=? AND status='active'",(uid,)).fetchone()
    return ok({'summary':dict(sums)|dict(due),'accounts':accts,'recent':recent,'daily':daily,'categories':bycat})

@api.get('/admin/users')
@root_required
def users():return ok(rows(get_db().execute('SELECT id,email,role,is_locked,must_change_password,created_at FROM users ORDER BY id')))
@api.patch('/admin/users/<int:i>')
@root_required
def user_patch(i):
    u=get_db().execute('SELECT * FROM users WHERE id=?',(i,)).fetchone()
    if not u:return fail('Không tìm thấy',404)
    if u['role']=='root':return fail('Không thể khóa tài khoản root')
    get_db().execute('UPDATE users SET is_locked=? WHERE id=?',(1 if body().get('is_locked') else 0,i));get_db().commit();return ok()
@api.delete('/admin/users/<int:i>')
@root_required
def user_delete(i):
    u=get_db().execute('SELECT role FROM users WHERE id=?',(i,)).fetchone()
    if not u:return fail('Không tìm thấy',404)
    if u['role']=='root':return fail('Không thể xóa tài khoản root')
    get_db().execute('DELETE FROM users WHERE id=?',(i,));get_db().commit();return ok()
@api.route('/admin/settings',methods=['GET','PUT'])
@root_required
def settings():
    db=get_db()
    if request.method=='GET':return ok({x['key']:x['value'] for x in db.execute('SELECT * FROM settings')})
    value='1' if body().get('registration_enabled') else '0';db.execute("UPDATE settings SET value=? WHERE key='registration_enabled'",(value,));db.commit();return ok({'registration_enabled':value})
@api.get('/admin/backup')
@root_required
def backup():
    folder=current_app.root_path+'/backups';import os;os.makedirs(folder,exist_ok=True);name='finance_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.db';target=folder+'/'+name
    source=get_db();dest=sqlite3.connect(target);source.backup(dest);dest.close()
    return send_file(target,as_attachment=True,download_name=name)
