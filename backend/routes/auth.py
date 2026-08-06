from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

ADMIN_SECRET_CODE = "ADMIN123"

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        requested_role = data.get('role', 'user')
        admin_code = data.get('admin_code', '')

        if not name or not email or not password:
            return jsonify({'message': 'Name, email, and password are required'}), 400

        # Check existing email
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email address is already registered'}), 400

        # Admin Code Check
        final_role = 'user'
        if requested_role == 'admin':
            if admin_code.strip() == ADMIN_SECRET_CODE:
                final_role = 'admin'
            else:
                return jsonify({'message': 'Invalid Admin secret passcode!'}), 403

        # Hash Password
        hashed_pw = generate_password_hash(password)

        # FIXED: Using 'password' instead of 'password_hash' to match User model
        new_user = User(
            name=name,
            email=email,
            password=hashed_pw,
            role=final_role
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': f'Registered successfully as {final_role}'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()

        # FIXED: Checks user.password instead of user.password_hash
        user_pw = getattr(user, 'password', None) or getattr(user, 'password_hash', None)

        if not user or not user_pw or not check_password_hash(user_pw, password):
            return jsonify({'message': 'Invalid email or password'}), 401

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }), 200
    except Exception as e:
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    db.session.commit()

    return jsonify({'message': 'Profile updated successfully'}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not check_password_hash(user.password, old_password):
        return jsonify({'message': 'Incorrect current password'}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'message': 'Password changed successfully'}), 200