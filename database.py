import sqlite3
from pathlib import Path
from flask import current_app, g
from werkzeug.security import generate_password_hash

SCHEMA = r"""
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN('user','root')), is_locked INTEGER NOT NULL DEFAULT 0, must_change_password INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, opening_balance INTEGER NOT NULL DEFAULT 0 CHECK(opening_balance>=0), is_hidden INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('income','expense')), UNIQUE(user_id,name,kind));
CREATE TABLE IF NOT EXISTS transactions(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, account_id INTEGER NOT NULL REFERENCES accounts(id), category_id INTEGER REFERENCES categories(id), type TEXT NOT NULL CHECK(type IN('income','expense','debt_payment','loan','adjustment')), amount INTEGER NOT NULL CHECK(amount>0), adjustment_sign INTEGER NOT NULL DEFAULT 1 CHECK(adjustment_sign IN(-1,1)), note TEXT NOT NULL DEFAULT '', occurred_on TEXT NOT NULL, debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS transfers(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, from_account_id INTEGER NOT NULL REFERENCES accounts(id), to_account_id INTEGER NOT NULL REFERENCES accounts(id), amount INTEGER NOT NULL CHECK(amount>0), note TEXT NOT NULL DEFAULT '', occurred_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK(from_account_id<>to_account_id));
CREATE TABLE IF NOT EXISTS debts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, total_amount INTEGER NOT NULL CHECK(total_amount>0), remaining_amount INTEGER NOT NULL CHECK(remaining_amount>=0), monthly_due INTEGER NOT NULL DEFAULT 0 CHECK(monthly_due>=0), due_date TEXT, priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN('low','medium','high')), status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','paid')), note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS debt_payments(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE, account_id INTEGER NOT NULL REFERENCES accounts(id), transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL, amount INTEGER NOT NULL CHECK(amount>0), paid_on TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id,occurred_on); CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(user_id,account_id); CREATE INDEX IF NOT EXISTS idx_debt_user ON debts(user_id,status); CREATE INDEX IF NOT EXISTS idx_transfer_user_date ON transfers(user_id,occurred_on);
"""

INCOMES = ['Be','Lái hộ','Tip','Bất động sản','Affiliate','Thu nhập khác']
EXPENSES = ['Ăn uống','Tiền nhà','Thiết yếu','Xăng, điện, đổi pin','Gia đình','Mua sắm','Chi phí kiếm tiền','Chi phí khác']

def connect(path):
    db=sqlite3.connect(path); db.row_factory=sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON'); db.execute('PRAGMA journal_mode=WAL'); db.execute('PRAGMA busy_timeout=5000')
    return db

def get_db():
    if 'db' not in g: g.db=connect(current_app.config['DATABASE'])
    return g.db

def close_db(_=None):
    db=g.pop('db',None)
    if db: db.close()

def seed_user(db, user_id):
    methods=('Tiền mặt','Ngân hàng','MoMo','Không xác định')
    db.executemany('INSERT INTO accounts(user_id,name,is_hidden) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM accounts WHERE user_id=? AND name=? COLLATE NOCASE)',[(user_id,x,1 if x=='Không xác định' else 0,user_id,x) for x in methods])
    db.executemany('INSERT OR IGNORE INTO categories(user_id,name,kind) VALUES(?,?,?)',[(user_id,x,'income') for x in INCOMES]+[(user_id,x,'expense') for x in EXPENSES])

def merge_duplicate_accounts(db):
    """Merge exact duplicate account names without losing balances or references."""
    groups=db.execute('SELECT user_id,lower(trim(name)) normalized,MIN(id) keep_id FROM accounts GROUP BY user_id,lower(trim(name)) HAVING COUNT(*)>1').fetchall()
    for group in groups:
        duplicates=db.execute('SELECT id,opening_balance FROM accounts WHERE user_id=? AND lower(trim(name))=? AND id<>?',(group['user_id'],group['normalized'],group['keep_id'])).fetchall()
        for duplicate in duplicates:
            duplicate_id=duplicate['id']; keep_id=group['keep_id']
            # Transfers between two duplicate representations cancel out after merging.
            db.execute('DELETE FROM transfers WHERE user_id=? AND ((from_account_id=? AND to_account_id=?) OR (from_account_id=? AND to_account_id=?))',(group['user_id'],duplicate_id,keep_id,keep_id,duplicate_id))
            db.execute('UPDATE transactions SET account_id=? WHERE account_id=?',(keep_id,duplicate_id))
            db.execute('UPDATE debt_payments SET account_id=? WHERE account_id=?',(keep_id,duplicate_id))
            db.execute('UPDATE transfers SET from_account_id=? WHERE from_account_id=?',(keep_id,duplicate_id))
            db.execute('UPDATE transfers SET to_account_id=? WHERE to_account_id=?',(keep_id,duplicate_id))
            db.execute('UPDATE accounts SET opening_balance=opening_balance+? WHERE id=?',(duplicate['opening_balance'],keep_id))
            db.execute('DELETE FROM accounts WHERE id=?',(duplicate_id,))
    db.execute('CREATE UNIQUE INDEX IF NOT EXISTS uq_accounts_user_name ON accounts(user_id,name COLLATE NOCASE)')

def ensure_user_phone_column(db):
    columns={row['name'] for row in db.execute('PRAGMA table_info(users)')}
    if 'phone' not in columns: db.execute('ALTER TABLE users ADD COLUMN phone TEXT')
    db.execute('CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users(phone) WHERE phone IS NOT NULL')

def init_db(app):
    path=Path(app.config['DATABASE']); path.parent.mkdir(parents=True,exist_ok=True)
    db=connect(path); db.executescript(SCHEMA); ensure_user_phone_column(db); merge_duplicate_accounts(db)
    db.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('registration_enabled','0')")
    db.execute("INSERT OR IGNORE INTO users(email,password_hash,role,must_change_password) VALUES(?,?,?,1)",('root@dangminh.com',generate_password_hash('Minh1111'),'root'))
    root=db.execute("SELECT id FROM users WHERE email=?",('root@dangminh.com',)).fetchone(); seed_user(db,root['id'])
    db.commit(); db.close()
