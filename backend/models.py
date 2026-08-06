from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')
    bookings = db.relationship('Booking', backref='user', lazy=True)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    venue = db.Column(db.String(150), nullable=False)
    ticket_price = db.Column(db.Float, nullable=False)
    available_seats = db.Column(db.Integer, nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(300), nullable=False)
    organizer = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Active')
    deadline = db.Column(db.String(50), nullable=False)
    bookings = db.relationship('Booking', backref='event', lazy=True)

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    tickets = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Confirmed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)