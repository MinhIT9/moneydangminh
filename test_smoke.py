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
        dash=self.c.get('/api/dashboard?month=2026-07').get_json()['data']; self.assertEqual(dash['summary']['income'],250000)
        debt=self.c.post('/api/debts',json={'name':'Khoản thử','total_amount':100000,'monthly_due':50000},headers=h).get_json()['data']['id']
        self.assertTrue(self.c.post(f'/api/debts/{debt}/payments',json={'account_id':accounts[0]['id'],'amount':50000,'paid_on':'2026-07-19'},headers=h).get_json()['success'])
        balances=self.c.get('/api/accounts').get_json()['data']; self.assertEqual(next(x for x in balances if x['id']==accounts[0]['id'])['balance'],200000)

if __name__=='__main__': unittest.main()
