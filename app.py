
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import requests



app = Flask(__name__)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///geografree.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.secret_key = '123456789'  # Replace this with your secret key

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(100))  # Assuming country names are at most 100 characters long
    favourite_flag = db.Column(db.String(100))  # Assuming it's stored as a string, such as a country code or name
    dream_holiday = db.Column(db.String(100))  # Assuming a simple description or location name
    xp = db.Column(db.Integer, default=0)  # Starts at 0 xp and increases as they complete quizzes

    def __repr__(self):
        return f'<User {self.username}>'

class HighScore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    quiz_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, default=0)

    user = db.relationship('User', backref=db.backref('high_scores', lazy='dynamic'))

    def __repr__(self):
        return f'<HighScore {self.quiz_name} - {self.score} by User {self.user_id}>'



@app.route('/get_high_score/<quiz_name>')
@login_required
def get_high_score(quiz_name):
    high_score = HighScore.query.filter_by(user_id=current_user.id, quiz_name=quiz_name).first()
    if high_score:
        return jsonify({'high_score': high_score.score})
    return jsonify({'high_score': 0})

@app.route('/update_high_score/<quiz_name>', methods=['POST'])
@login_required
def update_high_score(quiz_name):
    try:
        new_score = request.json.get('new_score', 0)
        high_score = HighScore.query.filter_by(user_id=current_user.id, quiz_name=quiz_name).first()

        if not high_score:
            high_score = HighScore(user_id=current_user.id, quiz_name=quiz_name, score=new_score)
            db.session.add(high_score)
        elif new_score > high_score.score:
            high_score.score = new_score
        
        db.session.commit()
        return jsonify({'status': 'success', 'new_high_score': high_score.score})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/get_countries')
def get_countries():
    # Make a request to the REST Countries API
    response = requests.get('https://restcountries.com/v3.1/all')
    countries = [(country['cca2'], country['name']['common']) for country in response.json()]
    return jsonify(countries)

@app.route('/get_favorite_flag')
@login_required
def get_favorite_flag():
    return jsonify({'favorite_flag': current_user.favourite_flag})

@app.route('/update_xp', methods=['POST'])
@login_required
def update_xp():
    try:
        xp_gained = request.json.get('xp', 0)
        current_user.xp += xp_gained
        db.session.commit()
        return jsonify({'status': 'success', 'new_xp': current_user.xp})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_leaderboard')
def get_leaderboard():
    top_users = User.query.order_by(User.xp.desc()).limit(10).all()
    leaderboard_data = [{
        'username': user.username,
        'xp': user.xp
    } for user in top_users]

    return jsonify(leaderboard_data)



@app.route('/')
def home():
    return render_template('index.html')

@app.route('/quizzes')
def quizzes():
    return render_template('quizzes.html')

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

# Other imports and code remain unchanged

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        current_user.country = request.form['country']
        current_user.favourite_flag = request.form['favourite_flag']
        current_user.dream_holiday = request.form['dream_holiday']
        db.session.commit()
        flash('Profile updated successfully!')
        return redirect(url_for('profile'))
    
    countries_data = get_countries().get_json()  # Assuming get_countries() returns a Flask response object with JSON
    return render_template('profile.html', user=current_user, countries=countries_data)



@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            flash('Login successful!')
            return redirect(url_for('home'))
        else:
            flash('Invalid username or password. Please try again.')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        if not username or not password or password != confirm_password:
            flash('Please check your registration details and try again.')
            return redirect(url_for('register'))

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Username already exists. Please choose a different one.')
            return redirect(url_for('register'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful!')
        return redirect(url_for('login'))

    return render_template('register.html')



@app.route('/search_results')
def search_results():
    return render_template('search_results.html')


###

@app.route('/countries')
def countries():
    return render_template('quizzes/countries.html')

@app.route('/capitals')
def capitals():
    return render_template('quizzes/capitals.html')

@app.route('/borders')
def borders():
    return render_template('quizzes/borders.html')

@app.route('/flags')
def flags():
    return render_template('quizzes/flags.html')

@app.route('/languages')
def languages():
    return render_template('quizzes/languages.html')

@app.route('/rivers')
def rivers():
    return render_template('quizzes/rivers.html')

###

@app.route('/borders_riddle_board')
def borders_riddle_board():
    return render_template('quizzes/borders/borders_riddle_board.html')

@app.route('/landlocked_countries_naming_challenge')
def landlocked_countries_naming_challenge():
    return render_template('quizzes/borders/landlocked_countries_naming_challenge.html')


###

@app.route('/capitals_riddle_board')
def capitals_riddle_board():
    return render_template('quizzes/capitals/capitals_riddle_board.html')

@app.route('/us_state_capitals_challenge')
def us_state_capitals_challenge():
    return render_template('quizzes/capitals/us_state_capitals_challenge.html')

@app.route('/world_capitals_naming_challenge')
def world_capitals_naming_challenge():
    return render_template('quizzes/capitals/world_capitals_naming_challenge.html')

@app.route('/world_countries_by_capital')
def world_countries_by_capital():
    return render_template('quizzes/capitals/world_countries_by_capital.html')

@app.route('/world_capitals_by_country')
def world_capitals_by_country():
    return render_template('quizzes/capitals/world_capitals_by_country.html')

###

@app.route('/african_country_name_challenge')
def african_country_name_challenge():
    return render_template('quizzes/countries/african_country_name_challenge.html')

@app.route('/asian_country_name_challenge')
def asian_country_name_challenge():
    return render_template('quizzes/countries/asian_country_name_challenge.html')

@app.route('/european_country_name_challenge')
def european_country_name_challenge():
    return render_template('quizzes/countries/european_country_name_challenge.html')

@app.route('/northamerican_country_name_challenge')
def northamerican_country_name_challenge():
    return render_template('quizzes/countries/northamerican_country_name_challenge.html')

@app.route('/oceanian_country_name_challenge')
def oceanian_country_name_challenge():
    return render_template('quizzes/countries/oceanian_country_name_challenge.html')

@app.route('/southamerican_country_name_challenge')
def southamerican_country_name_challenge():
    return render_template('quizzes/countries/southamerican_country_name_challenge.html')

@app.route('/world_country_name_challenge')
def world_country_name_challenge():
    return render_template('quizzes/countries/world_country_name_challenge.html')

###



@app.route('/non_country_flags_naming_challenge')
def non_country_flags_naming_challenge():
    return render_template('quizzes/flags/non_country_flags_naming_challenge.html')

@app.route('/world_flag_naming_challenge')
def world_flag_naming_challenge():
    return render_template('quizzes/flags/world_flag_naming_challenge.html')

###

@app.route('/most_spoken_languages_challenge')
def most_spoken_languages_challenge():
    return render_template('quizzes/languages/most_spoken_languages_challenge.html')

@app.route('/name_the_language_from_audio')
def name_the_language_from_audio():
    return render_template('quizzes/languages/name_the_language_from_audio.html')

@app.route('/name_the_language_from_text')
def name_the_language_from_text():
    return render_template('quizzes/languages/name_the_language_from_text.html')

###


@app.route('/world_longest_rivers')
def world_longest_rivers():
    return render_template('quizzes/rivers/world_longest_rivers.html')

###




if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        db.create_all()
    app.run(debug=True)


