import re, sqlite3, time
from datetime import date, datetime
from flask import Blueprint, request, session, current_app, send_file
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_db, seed_user
from auth import ok, fail, login_required, root_required, csrf_token, check_csrf
from services.finance_service import balance_sql, account_balance

api=Blueprint('api',__name__,url_prefix='/api')
EMAIL=re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
TYPES={'income','expense','debt_payment','loan','adjustment'}
LOGIN_ATTEMPTS={}
def body(): return request.get_json(silent=True) or {}
def integer(v,name='Số tiền',positive=True):
    if isinstance(v,bool): raise ValueError(f'{name} không hợp lệ')
    try: n=int(v)
    except: raise ValueError(f'{name} phải là số nguyên')
    if (positive and n<=0) or n<0: raise ValueError(f'{name} không hợp lệ')
    return n
def owned(table, ident): return get_db().execute(f'SELECT * FROM {table} WHERE id=? AND user_id=?',(ident,session['user_id'])).fetchone()
def rows(rs): return [dict(x) for x in rs]
def clean_text(value, name, maximum=300, required=False):
    value=str(value or '').strip()
    if required and not value: raise ValueError(f'{name} là bắt buộc')
    if len(value)>maximum: raise ValueError(f'{name} tối đa {maximum} ký tự')
    return value

def valid_date(value, name='Ngày'):
    try: date.fromisoformat(str(value)); return str(value)
    except (TypeError,ValueError): raise ValueError(f'{name} không hợp lệ')

def valid_month(value):
    if not re.fullmatch(r'\d{4}-(0[1-9]|1[0-2])',str(value)): raise ValueError('Tháng không hợp lệ')
    return str(value)

def payment_method_id(value=None):
    if value not in (None,''):
        method=owned('accounts',integer(value,'Phương thức'))
        if not method:raise ValueError('Phương thức thanh toán không hợp lệ')
        return method['id']
    row=get_db().execute("SELECT id FROM accounts WHERE user_id=? AND name='Không xác định' COLLATE NOCASE",(session['user_id'],)).fetchone()
    if not row:
        cur=get_db().execute("INSERT INTO accounts(user_id,name,is_hidden) VALUES(?,'Không xác định',1)",(session['user_id'],));return cur.lastrowid
    return row['id']

@api.post('/auth/login')
def login():
    d=body(); email=str(d.get('email','')).strip().lower(); key=(request.remote_addr or 'unknown',email);attempts=[x for x in LOGIN_ATTEMPTS.get(key,[]) if time.time()-x<300]
    if len(attempts)>=5:return fail('Đăng nhập sai quá nhiều lần, hãy thử lại sau 5 phút',429)
    u=get_db().execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
    if not u or not check_password_hash(u['password_hash'],str(d.get('password',''))):LOGIN_ATTEMPTS[key]=attempts+[time.time()];return fail('Email hoặc mật khẩu không đúng',401)
    if u['is_locked']: return fail('Tài khoản đã bị khóa',403)
    LOGIN_ATTEMPTS.pop(key,None);session.clear();session.permanent=True;session.update(user_id=u['id'],email=u['email'],role=u['role'],must_change_password=bool(u['must_change_password'])); token=csrf_token()
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
    q="SELECT a.*,0 balance FROM accounts a WHERE user_id=? AND name<>'Không xác định' COLLATE NOCASE ORDER BY is_hidden,name"
    return ok(rows(get_db().execute(q,(session['user_id'],))))
@api.post('/accounts')
@login_required
def add_account():
    d=body(); name=str(d.get('name','')).strip()
    if not name:return fail('Tên tài khoản là bắt buộc')
    try:cur=get_db().execute('INSERT INTO accounts(user_id,name,opening_balance) VALUES(?,?,0)',(session['user_id'],name));get_db().commit();return ok({'id':cur.lastrowid},201)
    except sqlite3.IntegrityError:return fail('Tên tài khoản đã tồn tại',409)

@api.get('/payment-methods')
@login_required
def payment_methods():return accounts()

@api.post('/payment-methods')
@login_required
def add_payment_method():return add_account()

@api.put('/payment-methods/<int:i>')
@login_required
def edit_payment_method(i):return edit_account(i)
@api.put('/accounts/<int:i>')
@login_required
def edit_account(i):
    if not owned('accounts',i):return fail('Không tìm thấy',404)
    d=body(); name=str(d.get('name','')).strip()
    if not name:return fail('Tên tài khoản là bắt buộc')
    try:get_db().execute('UPDATE accounts SET name=?,is_hidden=? WHERE id=?',(name,1 if d.get('is_hidden') else 0,i));get_db().commit();return ok()
    except sqlite3.IntegrityError:return fail('Tên tài khoản đã tồn tại',409)
@api.get('/accounts/<int:i>/history')
@login_required
def account_history(i):
    if not owned('accounts',i):return fail('Không tìm thấy',404)
    tx=rows(get_db().execute("SELECT id,occurred_on,note,type,amount,adjustment_sign,'transaction' source FROM transactions WHERE user_id=? AND account_id=? ORDER BY occurred_on DESC,id DESC",(session['user_id'],i)))
    moves=rows(get_db().execute("SELECT id,occurred_on,note,CASE WHEN from_account_id=? THEN 'transfer_out' ELSE 'transfer_in' END type,amount,1 adjustment_sign,'transfer' source FROM transfers WHERE user_id=? AND (from_account_id=? OR to_account_id=?) ORDER BY occurred_on DESC,id DESC",(i,session['user_id'],i,i)))
    return ok(sorted(tx+moves,key=lambda x:(x['occurred_on'],x['id']),reverse=True)[:200])

@api.get('/transactions')
@login_required
def transactions():
    where=['t.user_id=?']; args=[session['user_id']]
    for key,col in [('month','substr(t.occurred_on,1,7)'),('type','t.type'),('category_id','t.category_id'),('account_id','t.account_id')]:
        if request.args.get(key):where.append(col+'=?');args.append(request.args[key])
    if request.args.get('q'):where.append('(t.note LIKE ? OR c.name LIKE ?)');s='%'+request.args['q']+'%';args += [s,s]
    page=max(1,integer(request.args.get('page',1),'Trang')); per_page=min(100,max(10,integer(request.args.get('per_page',25),'Số dòng'))); offset=(page-1)*per_page
    base=' FROM transactions t JOIN accounts a ON a.id=t.account_id LEFT JOIN categories c ON c.id=t.category_id WHERE '+' AND '.join(where)
    total=get_db().execute('SELECT COUNT(*)'+base,args).fetchone()[0]
    q='SELECT t.*,a.name account_name,a.name payment_method_name,c.name category_name'+base+' ORDER BY occurred_on DESC,t.id DESC LIMIT ? OFFSET ?'
    return ok({'items':rows(get_db().execute(q,args+[per_page,offset])),'pagination':{'page':page,'per_page':per_page,'total':total,'pages':(total+per_page-1)//per_page}})
def validate_tx(d):
    typ=d.get('type'); amount=integer(d.get('amount')); occurred=valid_date(d.get('occurred_on',date.today().isoformat()))
    if typ not in TYPES:raise ValueError('Loại giao dịch không hợp lệ')
    date.fromisoformat(occurred)
    method=payment_method_id(d.get('payment_method_id',d.get('account_id')))
    cat=d.get('category_id') or None
    if cat:
        category=owned('categories',integer(cat,'Danh mục'))
        if not category:raise ValueError('Danh mục không hợp lệ')
        expected={'income':'income','expense':'expense'}.get(typ)
        if expected and category['kind']!=expected:raise ValueError('Danh mục không phù hợp với loại giao dịch')
    elif typ in ('income','expense'): raise ValueError('Vui lòng chọn danh mục')
    sign=-1 if str(d.get('adjustment_sign'))=='-1' else 1
    return typ,amount,occurred,cat,sign,method
@api.post('/transactions')
@login_required
def add_tx():
    d=body(); typ,amount,day,cat,sign,method=validate_tx(d)
    cur=get_db().execute('INSERT INTO transactions(user_id,account_id,category_id,type,amount,adjustment_sign,note,occurred_on) VALUES(?,?,?,?,?,?,?,?)',(session['user_id'],method,cat,typ,amount,sign,clean_text(d.get('note'),'Ghi chú'),day));get_db().commit();return ok({'id':cur.lastrowid},201)
@api.put('/transactions/<int:i>')
@login_required
def edit_tx(i):
    old=owned('transactions',i)
    if not old:return fail('Không tìm thấy',404)
    if old['debt_id']:return fail('Hãy quản lý giao dịch này từ khoản nợ')
    d=body(); typ,amount,day,cat,sign,method=validate_tx(d)
    get_db().execute('UPDATE transactions SET account_id=?,category_id=?,type=?,amount=?,adjustment_sign=?,note=?,occurred_on=? WHERE id=?',(method,cat,typ,amount,sign,clean_text(d.get('note'),'Ghi chú'),day,i));get_db().commit();return ok()
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
    valid_date(d.get('occurred_on',date.today().isoformat()))
    bal=account_balance(fr)
    if bal<amount:return fail('Số dư không đủ')
    cur=get_db().execute('INSERT INTO transfers(user_id,from_account_id,to_account_id,amount,note,occurred_on) VALUES(?,?,?,?,?,?)',(session['user_id'],fr,to,amount,clean_text(d.get('note'),'Ghi chú'),d.get('occurred_on',date.today().isoformat())));get_db().commit();return ok({'id':cur.lastrowid},201)
@api.get('/transfers')
@login_required
def transfers():
    return ok(rows(get_db().execute('SELECT tr.*,f.name from_account_name,t.name to_account_name FROM transfers tr JOIN accounts f ON f.id=tr.from_account_id JOIN accounts t ON t.id=tr.to_account_id WHERE tr.user_id=? ORDER BY occurred_on DESC,tr.id DESC LIMIT 200',(session['user_id'],))))
@api.delete('/transfers/<int:i>')
@login_required
def delete_transfer(i):
    tr=owned('transfers',i)
    if not tr:return fail('Không tìm thấy',404)
    if account_balance(tr['to_account_id'])<tr['amount']:return fail('Không thể hủy vì tài khoản nhận không còn đủ số dư')
    get_db().execute('DELETE FROM transfers WHERE id=?',(i,));get_db().commit();return ok()

@api.route('/debts',methods=['GET','POST'])
@login_required
def debts():
    db=get_db()
    if request.method=='GET':return ok(rows(db.execute('SELECT * FROM debts WHERE user_id=? ORDER BY status,due_date',(session['user_id'],))))
    d=body();total=integer(d.get('total_amount')); monthly=integer(d.get('monthly_due',0),'Khoản trả tháng',False); due=d.get('due_date') or None
    if due:valid_date(due,'Ngày đến hạn')
    priority=d.get('priority','medium')
    if priority not in ('low','medium','high'):raise ValueError('Mức ưu tiên không hợp lệ')
    cur=db.execute('INSERT INTO debts(user_id,name,total_amount,remaining_amount,monthly_due,due_date,priority,note) VALUES(?,?,?,?,?,?,?,?)',(session['user_id'],clean_text(d.get('name'),'Tên khoản nợ',100,True),total,total,monthly,due,priority,clean_text(d.get('note'),'Ghi chú')));db.commit();return ok({'id':cur.lastrowid},201)
@api.put('/debts/<int:i>')
@login_required
def edit_debt(i):
    debt=owned('debts',i)
    if not debt:return fail('Không tìm thấy',404)
    d=body(); total=integer(d.get('total_amount')); paid=debt['total_amount']-debt['remaining_amount']
    if total<paid:raise ValueError('Tổng nợ không thể thấp hơn số đã trả')
    monthly=integer(d.get('monthly_due',0),'Khoản trả tháng',False);due=d.get('due_date') or None
    if due:valid_date(due,'Ngày đến hạn')
    priority=d.get('priority','medium')
    if priority not in ('low','medium','high'):raise ValueError('Mức ưu tiên không hợp lệ')
    remaining=total-paid
    get_db().execute('UPDATE debts SET name=?,total_amount=?,remaining_amount=?,monthly_due=?,due_date=?,priority=?,note=?,status=? WHERE id=?',(clean_text(d.get('name'),'Tên khoản nợ',100,True),total,remaining,monthly,due,priority,clean_text(d.get('note'),'Ghi chú'),'paid' if remaining==0 else 'active',i));get_db().commit();return ok()
@api.delete('/debts/<int:i>')
@login_required
def delete_debt(i):
    debt=owned('debts',i)
    if not debt:return fail('Không tìm thấy',404)
    count=get_db().execute('SELECT COUNT(*) FROM debt_payments WHERE debt_id=?',(i,)).fetchone()[0]
    if count:return fail('Không thể xóa khoản nợ đã có lịch sử thanh toán')
    get_db().execute('DELETE FROM debts WHERE id=?',(i,));get_db().commit();return ok()
@api.get('/debts/<int:i>/payments')
@login_required
def debt_payment_history(i):
    if not owned('debts',i):return fail('Không tìm thấy',404)
    return ok(rows(get_db().execute('SELECT p.*,a.name account_name FROM debt_payments p JOIN accounts a ON a.id=p.account_id WHERE p.user_id=? AND p.debt_id=? ORDER BY paid_on DESC,p.id DESC',(session['user_id'],i))))
@api.post('/debts/<int:i>/payments')
@login_required
def pay_debt(i):
    debt=owned('debts',i); d=body()
    if not debt:return fail('Không tìm thấy',404)
    amount=integer(d.get('amount')); account=payment_method_id(d.get('payment_method_id',d.get('account_id'))); day=d.get('paid_on',date.today().isoformat())
    if amount>debt['remaining_amount']:return fail('Số tiền vượt quá dư nợ')
    valid_date(day,'Ngày trả'); db=get_db()
    try:
        db.execute('BEGIN'); cur=db.execute("INSERT INTO transactions(user_id,account_id,type,amount,note,occurred_on,debt_id) VALUES(?,?,?,?,?,?,?)",(session['user_id'],account,'debt_payment',amount,'Trả nợ: '+debt['name'],day,i));db.execute('INSERT INTO debt_payments(user_id,debt_id,account_id,transaction_id,amount,paid_on) VALUES(?,?,?,?,?,?)',(session['user_id'],i,account,cur.lastrowid,amount,day));remain=debt['remaining_amount']-amount;db.execute('UPDATE debts SET remaining_amount=?,status=? WHERE id=?',(remain,'paid' if remain==0 else 'active',i));db.commit()
    except:db.rollback();raise
    return ok()

@api.get('/dashboard')
@login_required
def dashboard():
    month=valid_month(request.args.get('month',date.today().strftime('%Y-%m')));db=get_db();uid=session['user_id']; today=date.today().isoformat()
    sums=db.execute("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) expense,COALESCE(SUM(CASE WHEN type='debt_payment' THEN amount END),0) paid,COALESCE(SUM(CASE WHEN type='income' AND occurred_on=? THEN amount END),0) today_income,COALESCE(SUM(CASE WHEN type='expense' AND occurred_on=? THEN amount END),0) today_expense FROM transactions WHERE user_id=? AND substr(occurred_on,1,7)=?",(today,today,uid,month)).fetchone()
    daily=rows(db.execute("SELECT occurred_on day,SUM(CASE WHEN type='income' THEN amount ELSE 0 END) income,SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) expense FROM transactions WHERE user_id=? AND substr(occurred_on,1,7)=? GROUP BY occurred_on ORDER BY occurred_on",(uid,month)))
    bycat=rows(db.execute("SELECT COALESCE(c.name,'Khác') label,SUM(t.amount) value,t.type FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=? AND substr(t.occurred_on,1,7)=? AND t.type IN('income','expense') GROUP BY t.type,c.name",(uid,month)))
    debt_progress=rows(db.execute("SELECT name label,total_amount total,remaining_amount remaining,(total_amount-remaining_amount) paid FROM debts WHERE user_id=? ORDER BY status,due_date LIMIT 10",(uid,)))
    methods=rows(db.execute("SELECT a.name label,COUNT(t.id) count,COALESCE(SUM(CASE WHEN t.type IN('expense','debt_payment') THEN t.amount ELSE 0 END),0) value FROM accounts a LEFT JOIN transactions t ON t.account_id=a.id AND substr(t.occurred_on,1,7)=? WHERE a.user_id=? AND a.name<>'Không xác định' COLLATE NOCASE GROUP BY a.id,a.name ORDER BY value DESC",(month,uid)))
    recent=rows(db.execute('SELECT t.*,a.name account_name,a.name payment_method_name,c.name category_name FROM transactions t JOIN accounts a ON a.id=t.account_id LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=? ORDER BY occurred_on DESC,t.id DESC LIMIT 8',(uid,)))
    due=db.execute("SELECT COALESCE(SUM(CASE WHEN due_date IS NULL OR substr(due_date,1,7)<=? THEN MIN(monthly_due,remaining_amount) ELSE 0 END),0) due,COALESCE(SUM(remaining_amount),0) remaining FROM debts WHERE user_id=? AND status='active'",(month,uid)).fetchone()
    previous=(datetime.strptime(month+'-01','%Y-%m-%d').replace(day=1)); previous_month=(previous.replace(day=1)-__import__('datetime').timedelta(days=1)).strftime('%Y-%m')
    prev=db.execute("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) income,COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) expense FROM transactions WHERE user_id=? AND substr(occurred_on,1,7)=?",(uid,previous_month)).fetchone()
    return ok({'month':month,'summary':dict(sums)|dict(due),'previous':dict(prev),'payment_methods':methods,'recent':recent,'daily':daily,'categories':bycat,'debt_progress':debt_progress})

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
@api.route('/admin/backup',methods=['GET','POST'])
@root_required
def backup():
    if not check_csrf():return fail('Phiên bảo mật không hợp lệ',403)
    folder=current_app.root_path+'/backups';import os;os.makedirs(folder,exist_ok=True);name='finance_'+datetime.now().strftime('%Y%m%d_%H%M%S')+'.db';target=folder+'/'+name
    source=get_db();dest=sqlite3.connect(target);source.backup(dest);dest.close()
    return send_file(target,as_attachment=True,download_name=name)
