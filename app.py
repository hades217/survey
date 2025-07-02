import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session
from pathlib import Path

app = Flask(__name__)
app.secret_key = 'change-me'  # replace with a random secret in production

DB_PATH = Path('survey.db')

# Ensure database exists
def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            'CREATE TABLE IF NOT EXISTS responses ('
            'id INTEGER PRIMARY KEY AUTOINCREMENT, '
            'q1 TEXT NOT NULL, '
            'q2 TEXT NOT NULL, '
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        )
        conn.commit()

init_db()

# Survey form
@app.route('/')
@app.route('/survey', methods=['GET', 'POST'])
def survey():
    if request.method == 'POST':
        q1 = request.form.get('q1', '')
        q2 = request.form.get('q2', '')
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute('INSERT INTO responses (q1, q2) VALUES (?, ?)', (q1, q2))
            conn.commit()
        return redirect(url_for('thank_you'))
    return render_template('index.html')

@app.route('/thank-you')
def thank_you():
    return "Thanks for your response!"

# Admin login
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'password'  # replace with secure password

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin'] = True
            return redirect(url_for('admin'))
    return render_template('admin_login.html')

@app.route('/admin')
def admin():
    if not session.get('admin'):
        return redirect(url_for('admin_login'))
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()
        c.execute('SELECT id, q1, q2, created_at FROM responses')
        rows = c.fetchall()
    return render_template('admin.html', rows=rows)

@app.route('/logout')
def logout():
    session.pop('admin', None)
    return redirect(url_for('survey'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
