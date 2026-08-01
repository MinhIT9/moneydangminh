import tempfile, unittest
from pathlib import Path
from app import create_app
from database import init_db, connect, merge_duplicate_accounts
from api import vn_today, VN_TZ

class SmokeTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.app=create_app(); self.app.config.update(TESTING=True,DATABASE=Path(self.tmp.name)/'test.db',SECRET_KEY='test'); init_db(self.app); self.c=self.app.test_client()
    def tearDown(self): self.tmp.cleanup()
    def test_finance_flow(self):
        r=self.c.get('/api/dashboard'); self.assertEqual(r.status_code,401)
        j=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json(); self.assertTrue(j['success']); token=j['data']['csrf_token']; h={'X-CSRF-Token':token}
        self.assertEqual(self.c.get('/api/dashboard').status_code,403)
        self.assertTrue(self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=h).get_json()['success'])
        accounts=self.c.get('/api/accounts').get_json()['data']; cats=self.c.get('/api/categories').get_json()['data']; income=next(x for x in cats if x['kind']=='income')
        tx={'type':'income','account_id':accounts[0]['id'],'category_id':income['id'],'amount':250000,'occurred_on':'2026-07-19','note':'Kiểm thử'}
        self.assertEqual(self.c.post('/api/transactions',json=tx,headers=h).status_code,201)
        listed=self.c.get('/api/transactions?month=2026-07').get_json()['data'];self.assertEqual(listed['pagination']['total'],1)
        bad={**tx,'type':'expense'};self.assertEqual(self.c.post('/api/transactions',json=bad,headers=h).status_code,400)
        dash=self.c.get('/api/dashboard?month=2026-07').get_json()['data']; self.assertEqual(dash['summary']['income'],250000)
        debt=self.c.post('/api/debts',json={'name':'Khoản thử','total_amount':100000,'monthly_due':50000},headers=h).get_json()['data']['id']
        self.assertTrue(self.c.post(f'/api/debts/{debt}/payments',json={'account_id':accounts[0]['id'],'amount':50000,'paid_on':'2026-07-19'},headers=h).get_json()['success'])
        methods=self.c.get('/api/payment-methods').get_json()['data']; self.assertEqual(len(methods),3)
        too_much={**tx,'type':'expense','category_id':next(x for x in cats if x['kind']=='expense')['id'],'amount':300000}
        self.assertEqual(self.c.post('/api/transactions',json=too_much,headers=h).status_code,201)
        optional={'type':'expense','category_id':next(x for x in cats if x['kind']=='expense')['id'],'amount':10000,'occurred_on':'2026-07-19','note':'Không chọn phương thức'}
        self.assertEqual(self.c.post('/api/transactions',json=optional,headers=h).status_code,201)
        self.assertTrue(self.c.get(f"/api/accounts/{accounts[0]['id']}/history").get_json()['success'])
        self.assertEqual(len(self.c.get(f'/api/debts/{debt}/payments').get_json()['data']),1)
        self.assertEqual(self.c.delete(f'/api/debts/{debt}',json={},headers=h).status_code,409)
        self.assertTrue(self.c.delete(f'/api/debts/{debt}',json={'confirm':True},headers=h).get_json()['success'])
        ledger=self.c.get('/api/transactions?month=2026-07').get_json()['data']['items'];self.assertTrue(any(x['type']=='debt_payment' and x['debt_id'] is None for x in ledger))

    def test_user_isolation(self):
        db_headers={}
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();h={'X-CSRF-Token':login['data']['csrf_token']}
        self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=h)
        self.c.put('/api/admin/settings',json={'registration_enabled':True},headers=h)
        self.c.post('/api/auth/logout',headers=h)
        registration={'email':'user@example.com','phone':'0901234567','password':'Password123','password_confirmation':'Password123'}
        self.assertEqual(self.c.post('/api/auth/register',json=registration).status_code,201)
        self.assertEqual(self.c.post('/api/auth/register',json={**registration,'email':'other@example.com'}).status_code,409)
        login=self.c.post('/api/auth/login',json={'email':'user@example.com','password':'Password123'}).get_json();db_headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.assertEqual(len(self.c.get('/api/payment-methods').get_json()['data']),3)
        self.assertEqual(self.c.get('/api/admin/users').status_code,403)

    def test_registration_requires_phone_and_password_confirmation(self):
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=headers)
        self.c.put('/api/admin/settings',json={'registration_enabled':True},headers=headers)
        missing_phone=self.c.post('/api/auth/register',json={'email':'new@example.com','password':'Password123','password_confirmation':'Password123'});self.assertEqual(missing_phone.status_code,400)
        mismatch=self.c.post('/api/auth/register',json={'email':'new@example.com','phone':'0912345678','password':'Password123','password_confirmation':'KhacPassword123'});self.assertEqual(mismatch.status_code,400)

    def test_duplicate_accounts_are_merged(self):
        with self.app.app_context():
            db=connect(self.app.config['DATABASE']);db.execute('DROP INDEX uq_accounts_user_name');uid=db.execute('SELECT id FROM users WHERE role="root"').fetchone()['id'];keep=db.execute('SELECT id FROM accounts WHERE user_id=? AND name="MoMo"',(uid,)).fetchone()['id'];dup=db.execute('INSERT INTO accounts(user_id,name,opening_balance) VALUES(?,?,?)',(uid,'momo',12000)).lastrowid;db.execute("INSERT INTO transactions(user_id,account_id,type,amount,occurred_on) VALUES(?,?,?,?,?)",(uid,dup,'income',3000,'2026-07-01'));db.commit();merge_duplicate_accounts(db);db.commit();count=db.execute('SELECT COUNT(*) FROM accounts WHERE user_id=? AND lower(name)="momo"',(uid,)).fetchone()[0];opening=db.execute('SELECT opening_balance FROM accounts WHERE id=?',(keep,)).fetchone()[0];tx_account=db.execute('SELECT account_id FROM transactions WHERE note="" AND amount=3000').fetchone()[0];db.close();self.assertEqual(count,1);self.assertEqual(opening,12000);self.assertEqual(tx_account,keep)

    def test_seeding_is_idempotent(self):
        init_db(self.app);init_db(self.app)
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=headers)
        self.assertEqual(len(self.c.get('/api/accounts').get_json()['data']),3)

    def test_vietnam_timezone(self):
        from datetime import datetime
        self.assertEqual(vn_today(),datetime.now(VN_TZ).date())

    def test_delete_category_unclassifies_transactions(self):
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=headers)
        category=self.c.post('/api/categories',json={'name':'Danh mục sẽ xóa','kind':'income'},headers=headers).get_json()['data']['id']
        transaction=self.c.post('/api/transactions',json={'type':'income','category_id':category,'amount':50000,'occurred_on':'2026-07-20'},headers=headers).get_json()['data']['id']
        self.assertEqual(self.c.delete(f'/api/categories/{category}',json={},headers=headers).status_code,409)
        result=self.c.delete(f'/api/categories/{category}',json={'confirm':True},headers=headers).get_json();self.assertEqual(result['data']['unclassified_transactions'],1)
        with self.app.app_context():
            db=connect(self.app.config['DATABASE']);row=db.execute('SELECT category_id FROM transactions WHERE id=?',(transaction,)).fetchone();db.close();self.assertIsNone(row['category_id'])

    def test_spa_routes_require_login_and_render(self):
        self.assertEqual(self.c.get('/debts').status_code,302)
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json()
        for path in ('/dashboard','/transactions','/methods','/debts','/settings'):
            response=self.c.get(path);self.assertEqual(response.status_code,200);self.assertIn(b'app.js?v=10',response.data)

    def test_landing_page_is_public(self):
        for path in ('/','/landing','/welcome'):
            response=self.c.get(path);self.assertEqual(response.status_code,200);self.assertIn(b'Minh Finance',response.data);self.assertIn(b'/register',response.data)
        self.assertEqual(self.c.get('/dashboard').status_code,302)
        self.assertEqual(self.c.get('/api/dashboard').status_code,401)

    def test_logout_leaves_dashboard_protected_and_landing_public(self):
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.assertTrue(self.c.post('/api/auth/logout',headers=headers).get_json()['success'])
        self.assertEqual(self.c.get('/dashboard').status_code,302)
        self.assertEqual(self.c.get('/landing').status_code,200)

if __name__=='__main__': unittest.main()
