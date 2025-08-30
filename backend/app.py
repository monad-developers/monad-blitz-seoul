
from web3 import Web3
from dotenv import load_dotenv
import json

import csv
import io
import qrcode
from flask import Flask, jsonify, request, send_file
import os
from models import create_all, User, session_scope
import jwt
import datetime


load_dotenv()

# 컨트랙트/네트워크 환경변수
CONTRACT_ADDRESS = os.environ.get("CONTRACT_ADDRESS")
CHAIN_ID = int(os.environ.get("CHAIN_ID", "0"))
RAFFLE_NAME = os.environ.get("RAFFLE_NAME", "SponsoredRaffle")
RAFFLE_VERSION = os.environ.get("RAFFLE_VERSION", "1")
RPC_URL = os.environ.get("RPC_URL")


from werkzeug.utils import secure_filename
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
create_all()  # 앱 인스턴스 생성 직후 DB 자동 생성


from werkzeug.security import generate_password_hash, check_password_hash

from models import Event, Prize
# 경품 등록: JWT 인증 필요, 이미지 파일 업로드
@app.route('/api/prizes', methods=['POST'])
def create_prize():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization header required'}), 401
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'invalid token'}), 401

    event_id = request.form.get('event_id')
    name = request.form.get('name')
    winners_count = request.form.get('winners_count')
    description = request.form.get('description')
    file = request.files.get('image')
    if not event_id or not name or not winners_count:
        return jsonify({'error': 'event_id, name, winners_count required'}), 400

    image_path = None
    if file:
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        image_path = file_path

    with session_scope() as s:
        # 이벤트 소유자 확인
        event = s.query(Event).filter_by(id=event_id, owner_id=user_id).first()
        if not event:
            return jsonify({'error': 'event not found or not owned by user'}), 404
        prize = Prize(
            event_id=event_id,
            name=name.strip() if name else None,
            winners_count=int(winners_count),
            description=description.strip() if description else None,
            image_path=image_path
        )
        s.add(prize)
        s.flush()
        return jsonify({'id': prize.id, 'name': prize.name, 'image_path': prize.image_path}), 201

# 경품 목록 조회: JWT 인증 필요, event_id 쿼리 파라미터 필요
@app.route('/api/prizes', methods=['GET'])
def list_prizes():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization header required'}), 401
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'invalid token'}), 401
    event_id = request.args.get('event_id')
    if not event_id:
        return jsonify({'error': 'event_id required'}), 400
    with session_scope() as s:
        # 이벤트 소유자 확인
        event = s.query(Event).filter_by(id=event_id, owner_id=user_id).first()
        if not event:
            return jsonify({'error': 'event not found or not owned by user'}), 404
        prizes = s.query(Prize).filter_by(event_id=event_id).order_by(Prize.created_at.desc()).all()
        result = [
            {
                'id': p.id,
                'name': p.name,
                'winners_count': p.winners_count,
                'description': p.description,
                'image_path': p.image_path
            }
            for p in prizes
        ]
        return jsonify(result)

# 회원가입: 이메일, 비밀번호 필수

# 이벤트 생성 (POST) 및 유저별 이벤트 목록 조회 (GET)
from flask import send_from_directory
import uuid

# 이벤트 생성: JWT 인증 필요, CSV 파일 업로드
@app.route('/api/events', methods=['POST'])
def create_event():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization header required'}), 401
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'invalid token'}), 401

    name = request.form.get('name')
    start_at = request.form.get('start_at')
    end_at = request.form.get('end_at')
    participant_cap = request.form.get('participant_cap')
    file = request.files.get('csv')
    if not name or not start_at or not end_at:
        return jsonify({'error': 'name, start_at, end_at required'}), 400

    upload_csv_path = None
    if file:
        filename = secure_filename(f"{uuid.uuid4()}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        upload_csv_path = file_path

    with session_scope() as s:
        event = Event(
            owner_id=user_id,
            name=name,
            start_at=start_at,
            end_at=end_at,
            participant_cap=int(participant_cap) if participant_cap else None,
            upload_csv_path=upload_csv_path
        )
        s.add(event)
        s.flush()
        return jsonify({'id': event.id, 'name': event.name, 'upload_csv_path': event.upload_csv_path}), 201

# 유저가 만든 이벤트 목록 조회 (JWT 인증 필요)
@app.route('/api/events', methods=['GET'])
def list_events():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization header required'}), 401
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'invalid token'}), 401
    with session_scope() as s:
        events = s.query(Event).filter_by(owner_id=user_id).order_by(Event.created_at.desc()).all()
        result = [
            {
                'id': e.id,
                'name': e.name,
                'start_at': e.start_at,
                'end_at': e.end_at,
                'participant_cap': e.participant_cap,
                'upload_csv_path': e.upload_csv_path
            }
            for e in events
        ]
        return jsonify(result)
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    wallet_address = data.get('wallet_address')
    if not email or not password:
        return jsonify({'error': 'email, password required'}), 400
    with session_scope() as s:
        if s.query(User).filter_by(email=email).first():
            return jsonify({'error': 'email already exists'}), 409
        if wallet_address and s.query(User).filter_by(wallet_address=wallet_address).first():
            return jsonify({'error': 'wallet_address already exists'}), 409
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            wallet_address=wallet_address
        )
        s.add(user)
        s.flush()
        return jsonify({'id': user.id, 'email': user.email, 'wallet_address': user.wallet_address}), 201




# 로그인: 이메일+비밀번호로 인증
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'email, password required'}), 400
    with session_scope() as s:
        user = s.query(User).filter_by(email=email).first()
        if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'invalid credentials'}), 401
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token, 'user': {'id': user.id, 'email': user.email, 'wallet_address': user.wallet_address}})


# 이벤트 응모 QR코드 반환 (PNG)
@app.route('/api/events/<int:event_id>/qr', methods=['GET'])
def event_qr(event_id):
    # 실제 서비스라면, 프론트엔드의 응모 페이지 URL을 아래에 맞게 작성
    base_url = os.environ.get('ENTRY_PAGE_URL', 'http://localhost/mobile')
    qr_url = f"{base_url}?event_id={event_id}"
    img = qrcode.make(qr_url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png', as_attachment=False, download_name=f'event_{event_id}_qr.png')


# CSV 헤더(필드명) 추출 API
@app.route('/api/events/<int:event_id>/csv-fields', methods=['GET'])
def get_event_csv_fields(event_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Authorization header required'}), 401
    try:
        token = token.replace('Bearer ', '')
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'invalid token'}), 401
    with session_scope() as s:
        event = s.query(Event).filter_by(id=event_id, owner_id=user_id).first()
        if not event:
            return jsonify({'error': 'event not found or not owned by user'}), 404
        if not event.upload_csv_path or not os.path.exists(event.upload_csv_path):
            return jsonify({'error': 'csv file not found'}), 404
        try:
            with open(event.upload_csv_path, newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                headers = next(reader)
            return jsonify({'fields': headers})
        except Exception as e:
            return jsonify({'error': str(e)}), 500



# ABI 로드
CONTRACT_ABI = None
try:
    abi_path = os.path.join(os.path.dirname(__file__), '../artifacts/contracts/SponsoredRaffle.sol/SponsoredRaffle.json')
    with open(abi_path) as f:
        CONTRACT_ABI = json.load(f)["abi"]
except Exception as e:
    print("[WARN] ABI 파일 로드 실패:", e)

# web3 인스턴스 및 컨트랙트
w3 = Web3(Web3.HTTPProvider(RPC_URL)) if RPC_URL else None
raffle_contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI) if w3 and CONTRACT_ABI and CONTRACT_ADDRESS else None



# 컨트랙트 config 정보 반환
@app.route('/api/raffle/config', methods=['GET'])
def get_raffle_config():
    if not raffle_contract:
        return jsonify({'error': 'contract not configured'}), 500
    try:
        raffle_id = raffle_contract.functions.raffleId().call()
        return jsonify({
            'contract': CONTRACT_ADDRESS,
            'chainId': CHAIN_ID,
            'name': RAFFLE_NAME,
            'version': RAFFLE_VERSION,
            'raffleId': int(raffle_id)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 라플 락(lock) 트랜잭션
@app.route('/api/raffle/lock', methods=['POST'])
def raffle_lock():
    if not raffle_contract:
        return jsonify({'error': 'contract not configured'}), 500
    try:
        # PRIVATE_KEY로 서명자 계정 준비
        private_key = os.environ.get('PRIVATE_KEY')
        if not private_key:
            return jsonify({'error': 'PRIVATE_KEY not set'}), 500
        acct = w3.eth.account.from_key(private_key)
        tx = raffle_contract.functions.lock().build_transaction({
            'from': acct.address,
            'nonce': w3.eth.get_transaction_count(acct.address),
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
            'chainId': CHAIN_ID
        })
        signed = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        rcpt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return jsonify({'ok': True, 'txHash': rcpt.transactionHash.hex()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health')
def health():
    try:
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
