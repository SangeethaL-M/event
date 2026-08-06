from flask import Blueprint, request, jsonify
from models import db, Event, Booking
from flask_jwt_extended import jwt_required, get_jwt_identity

bookings_bp = Blueprint('bookings', __name__)

# Razorpay Test Key ID
RAZORPAY_KEY_ID = "rzp_test_RTHhlZabuiuFWK"

@bookings_bp.route('/create-order', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.get_json() or {}
    event_id = data.get('event_id')
    tickets = int(data.get('tickets', 1))

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # Calculate amount in paise for INR (or cents for USD)
    amount_in_subunits = int(event.ticket_price * tickets * 100)

    return jsonify({
        'order_id': f'order_dummy_{event_id}_{tickets}',
        'amount': amount_in_subunits,
        'currency': 'INR',
        'key_id': RAZORPAY_KEY_ID
    }), 200


@bookings_bp.route('/verify-payment', methods=['POST', 'OPTIONS'])
def verify_payment():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.get_json() or {}
    event_id = data.get('event_id')
    tickets = int(data.get('tickets', 1))

    event = Event.query.get(event_id)
    if not event or event.available_seats < tickets:
        return jsonify({'message': 'Seats unavailable'}), 400

    total_amount = float(event.ticket_price) * tickets
    event.available_seats -= tickets

    new_booking = Booking(
        user_id=1,
        event_id=event.id,
        tickets=tickets,
        total_amount=total_amount,
        status='Confirmed'
    )

    try:
        db.session.add(new_booking)
        db.session.commit()
        return jsonify({'message': 'Payment Verified & Booking Confirmed!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'error': str(e)}), 500


@bookings_bp.route('', methods=['POST'])
@bookings_bp.route('/<int:event_id>', methods=['POST'])
def create_booking(event_id=None):
    data = request.get_json() or {}
    target_event_id = event_id or data.get('event_id')
    tickets = int(data.get('tickets', 1))

    event = Event.query.get(target_event_id)
    if not event or event.available_seats < tickets:
        return jsonify({'message': 'Seats unavailable'}), 400

    total_amount = float(event.ticket_price) * tickets
    event.available_seats -= tickets

    new_booking = Booking(
        user_id=1,
        event_id=event.id,
        tickets=tickets,
        total_amount=total_amount,
        status='Confirmed'
    )

    try:
        db.session.add(new_booking)
        db.session.commit()
        return jsonify({'message': 'Booking successful!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error saving booking'}), 500


@bookings_bp.route('', methods=['GET'])
@bookings_bp.route('/my', methods=['GET'])
def get_user_bookings():
    user_bookings = Booking.query.filter_by(user_id=1).all()
    result = []
    for b in user_bookings:
        event = Event.query.get(b.event_id)
        result.append({
            'id': b.id,
            'event_id': b.event_id,
            'event_title': event.title if event else 'Event',
            'event_date': event.date if event else 'N/A',
            'venue': event.venue if event else 'N/A',
            'tickets': b.tickets,
            'total_amount': b.total_amount,
            'status': b.status
        })
    return jsonify(result), 200

@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def cancel_booking(booking_id):
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({'message': 'Booking not found'}), 404

    # Restore seats to event
    event = Event.query.get(booking.event_id)
    if event:
        event.available_seats += booking.tickets

    db.session.delete(booking)
    db.session.commit()

    return jsonify({'message': 'Booking cancelled successfully'}), 200