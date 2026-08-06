from flask import Blueprint, request, jsonify
from models import db, Event, Booking
from flask_jwt_extended import jwt_required, get_jwt_identity

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['GET'])
def get_events():
    category = request.args.get('category')
    search = request.args.get('search')
    query = Event.query

    if category:
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Event.title.ilike(f'%{search}%') | Event.venue.ilike(f'%{search}%'))

    events = query.all()
    return jsonify([{
        'id': e.id, 'title': e.title, 'category': e.category, 'date': e.date,
        'venue': e.venue, 'ticket_price': e.ticket_price, 'available_seats': e.available_seats,
        'total_seats': e.total_seats, 'image_url': e.image_url, 'organizer': e.organizer,
        'status': e.status, 'deadline': e.deadline
    } for e in events]), 200

@events_bp.route('/<int:id>', methods=['GET'])
def get_event(id):
    e = Event.query.get_or_404(id)
    return jsonify({
        'id': e.id, 'title': e.title, 'category': e.category, 'date': e.date,
        'venue': e.venue, 'ticket_price': e.ticket_price, 'available_seats': e.available_seats,
        'total_seats': e.total_seats, 'image_url': e.image_url, 'organizer': e.organizer,
        'status': e.status, 'deadline': e.deadline
    }), 200

@events_bp.route('', methods=['POST'])
def add_event():
    # Remove get_jwt_identity() call completely when @jwt_required is off
    data = request.get_json() or {}
    
    new_event = Event(
        title=data.get('title'),
        category=data.get('category'),
        date=data.get('date'),
        venue=data.get('venue') or data.get('location'),
        ticket_price=float(data.get('ticket_price') or data.get('price') or 0),
        available_seats=int(data.get('total_seats') or 0),
        total_seats=int(data.get('total_seats') or 0),
        image_url=data.get('image_url') or 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
        organizer=data.get('organizer', 'Admin'),
        status=data.get('status', 'Active'),
        deadline=data.get('deadline') or data.get('date')
    )
    
    db.session.add(new_event)
    db.session.commit()
    return jsonify({'message': 'Event created successfully'}), 201

from datetime import datetime
from flask import request, jsonify

from datetime import datetime
from flask import request, jsonify

from datetime import datetime
from flask import request, jsonify

@events_bp.route('/<int:event_id>', methods=['PUT', 'OPTIONS'])
def update_event(event_id):
    if request.method == 'OPTIONS':
        return '', 200

    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404

        data = request.get_json() or {}

        # Safely assign values without strict date parsing
        if 'title' in data: event.title = data['title']
        if 'location' in data: event.location = data['location']
        if 'category' in data: event.category = data['category']
        if 'date' in data: event.date = str(data['date'])
        if 'description' in data: event.description = data['description']
        if 'image_url' in data: event.image_url = data['image_url']

        # Handle price safely
        if 'price' in data and data['price'] is not None:
            try:
                event.price = float(data['price'])
            except (ValueError, TypeError):
                pass

        # Handle seat counts safely matching your DB model
        if 'total_seats' in data and data['total_seats'] is not None:
            try:
                seats = int(data['total_seats'])
                if hasattr(event, 'total_seats'): event.total_seats = seats
                if hasattr(event, 'available_seats'): event.available_seats = seats
                if hasattr(event, 'seats'): event.seats = seats
            except (ValueError, TypeError):
                pass

        db.session.commit()
        return jsonify({'message': 'Event updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print("UPDATE EVENT ERROR:", str(e))
        return jsonify({'message': f'Server Error: {str(e)}'}), 400

@events_bp.route('/<int:event_id>', methods=['DELETE', 'OPTIONS'])
def delete_event(event_id):
    if request.method == 'OPTIONS':
        return '', 200

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    try:
        # Delete related bookings first to avoid foreign key issues
        Booking.query.filter_by(event_id=event_id).delete()

        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting event: {str(e)}'}), 500