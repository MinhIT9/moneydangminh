import tempfile, unittest
from pathlib import Path
from app import create_app
from database import init_db

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
        balances=self.c.get('/api/accounts').get_json()['data']; self.assertEqual(next(x for x in balances if x['id']==accounts[0]['id'])['balance'],200000)
        too_much={**tx,'type':'expense','category_id':next(x for x in cats if x['kind']=='expense')['id'],'amount':300000}
        self.assertEqual(self.c.post('/api/transactions',json=too_much,headers=h).status_code,400)
        self.assertTrue(self.c.get(f"/api/accounts/{accounts[0]['id']}/history").get_json()['success'])
        self.assertEqual(len(self.c.get(f'/api/debts/{debt}/payments').get_json()['data']),1)

    def test_user_isolation(self):
        db_headers={}
        login=self.c.post('/api/auth/login',json={'email':'root@dangminh.com','password':'Minh1111'}).get_json();h={'X-CSRF-Token':login['data']['csrf_token']}
        self.c.post('/api/auth/change-password',json={'current_password':'Minh1111','new_password':'MatKhauMoi123'},headers=h)
        self.c.put('/api/admin/settings',json={'registration_enabled':True},headers=h)
        self.c.post('/api/auth/logout',headers=h)
        self.assertEqual(self.c.post('/api/auth/register',json={'email':'user@example.com','password':'Password123'}).status_code,201)
        login=self.c.post('/api/auth/login',json={'email':'user@example.com','password':'Password123'}).get_json();db_headers={'X-CSRF-Token':login['data']['csrf_token']}
        self.assertEqual(len(self.c.get('/api/accounts').get_json()['data']),3)
        self.assertEqual(self.c.get('/api/admin/users').status_code,403)

if __name__=='__main__': unittest.main()
