from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db, User, Event
from werkzeug.security import generate_password_hash

# Import routes
from routes.auth import auth_bp
from routes.events import events_bp
from routes.bookings import bookings_bp
from routes.admin import admin_bp

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt = JWTManager(app)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(events_bp, url_prefix='/api/events')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

def init_db():
    with app.app_context():
        db.create_all()
        
        # Add Admin and Demo User if not existing
        if not User.query.filter_by(email='admin@event.com').first():
            admin = User(name='Admin Master', email='admin@event.com', password=generate_password_hash('admin123'), role='admin')
            user1 = User(name='John Doe', email='john@gmail.com', password=generate_password_hash('user123'), role='user')
            db.session.add_all([admin, user1])

        # Add Sample Events if database is empty
        if Event.query.count() == 0:
            sample_events = [
                Event(
                    title='Global AI & Cloud Summit 2026',
                    category='Technology',
                    date='2026-10-15 09:00 AM',
                    venue='Tech Park Convention Center',
                    ticket_price=150.00,
                    available_seats=100,
                    total_seats=100,
                    image_url='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
                    organizer='Tech Innovators Forum',
                    status='Active',
                    deadline='2026-10-14'
                ),
                Event(
                    title='International Music Fest 2026',
                    category='Music',
                    date='2026-11-20 06:00 PM',
                    venue='Grand Arena Stadium',
                    ticket_price=85.00,
                    available_seats=250,
                    total_seats=250,
                    image_url='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
                    organizer='Live Nation',
                    status='Active',
                    deadline='2026-11-19'
                )
            ]
            db.session.add_all(sample_events)
            
        db.session.commit()

init_db()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)

@app.route('/')
def home():
    return {"status": "Backend API is running live!"}