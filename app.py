from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    current_date = datetime.now()
    return render_template('index.html', year=current_date.year, month=current_date.month)

if __name__ == '__main__':
    app.run(debug=True)