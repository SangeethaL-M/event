from flask import Blueprint, request, jsonify
from models import db, User, Event, Booking

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ---------------------------------------------------------
# 1. GET ALL USERS
# ---------------------------------------------------------
@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        user_list = []
        for u in users:
            user_list.append({
                'id': u.id,
                'email': u.email,
                'role': getattr(u, 'role', 'user')
            })
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------
# 2. DELETE A USER BY ID
# ---------------------------------------------------------
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------
# 3. GET DASHBOARD STATISTICS
# ---------------------------------------------------------
@admin_bp.route('/stats', methods=['GET'])
def admin_stats():
    try:
        # Total counts
        total_users = User.query.count()
        total_events = Event.query.count()
        
        # Bookings count
        total_bookings = Booking.query.count() if 'Booking' in globals() else 0

        # Event status breakdown
        all_events = Event.query.all()
        active_events = 0
        completed_events = 0
        total_revenue = 0

        event_popularity = []

        for e in all_events:
            total_seats = getattr(e, 'total_seats', 0) or 0
            available_seats = getattr(e, 'available_seats', 0) or 0
            booked_seats = max(0, total_seats - available_seats)

            if total_seats > 0 and available_seats > 0:
                active_events += 1
            else:
                completed_events += 1

            # Ticket price calculation
            price = getattr(e, 'ticket_price', None) or getattr(e, 'price', 0) or 0
            total_revenue += (price * booked_seats)

            event_popularity.append({
                'id': e.id,
                'title': e.title,
                'total_seats': total_seats,
                'available_seats': available_seats,
                'booked_seats': booked_seats
            })

        # Recent registrations (last 5 users)
        recent_users = User.query.order_by(User.id.desc()).limit(5).all()
        recent_registrations = [
            {'id': u.id, 'email': u.email, 'role': getattr(u, 'role', 'user')}
            for u in recent_users
        ]

        return jsonify({
            'total_users': total_users,
            'total_events': total_events,
            'active_events': active_events,
            'completed_events': completed_events,
            'total_bookings': total_bookings,
            'revenue_summary': total_revenue,
            'recent_registrations': recent_registrations,
            'event_popularity': event_popularity
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------
# 4. CREATE NEW EVENT (ADMIN ONLY)
# ---------------------------------------------------------
@admin_bp.route('/events', methods=['POST'])
def create_event():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No input data provided'}), 400

        new_event = Event(
            title=data.get('title'),
            category=data.get('category', 'General'),
            ticket_price=data.get('ticket_price', data.get('price', 0)),
            total_seats=data.get('total_seats', 100),
            available_seats=data.get('available_seats', data.get('total_seats', 100)),
            image_url=data.get('image_url', ''),
            description=data.get('description', ''),
            venue=data.get('venue', 'Online'),
            date=data.get('date', '')
        )

        db.session.add(new_event)
        db.session.commit()

        return jsonify({'message': 'Event created successfully', 'event_id': new_event.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------
# 5. UPDATE AN EVENT BY ID
# ---------------------------------------------------------
@admin_bp.route('/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404

        data = request.get_json()
        if 'title' in data:
            event.title = data['title']
        if 'category' in data:
            event.category = data['category']
        if 'ticket_price' in data or 'price' in data:
            event.ticket_price = data.get('ticket_price', data.get('price'))
        if 'total_seats' in data:
            event.total_seats = data['total_seats']
        if 'available_seats' in data:
            event.available_seats = data['available_seats']
        if 'image_url' in data:
            event.image_url = data['image_url']
        if 'description' in data:
            event.description = data['description']

        db.session.commit()
        return jsonify({'message': 'Event updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------
# 6. DELETE AN EVENT BY ID
# ---------------------------------------------------------
@admin_bp.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404

        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500