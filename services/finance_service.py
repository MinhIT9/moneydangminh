from database import get_db

DEBIT_TYPES = {'expense', 'debt_payment'}

def balance_sql(alias='a'):
    return f"{alias}.opening_balance+COALESCE((SELECT SUM(CASE WHEN type IN('income','loan') THEN amount WHEN type IN('expense','debt_payment') THEN -amount ELSE amount*adjustment_sign END) FROM transactions t WHERE t.account_id={alias}.id),0)+COALESCE((SELECT SUM(CASE WHEN tr.to_account_id={alias}.id THEN tr.amount ELSE -tr.amount END) FROM transfers tr WHERE tr.from_account_id={alias}.id OR tr.to_account_id={alias}.id),0)"

def account_balance(account_id):
    return get_db().execute(f'SELECT {balance_sql()} balance FROM accounts a WHERE a.id=?', (account_id,)).fetchone()['balance']

def transaction_effect(tx_type, amount, sign=1):
    if tx_type in ('income', 'loan'):
        return amount
    if tx_type in DEBIT_TYPES:
        return -amount
    return amount * sign

def ensure_sufficient_balance(account_id, new_effect, old_effect=0):
    # Current balance already includes the old transaction when editing.
    projected = account_balance(account_id) - old_effect + new_effect
    if projected < 0:
        raise ValueError('Số dư tài khoản không đủ')

