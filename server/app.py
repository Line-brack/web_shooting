from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except Exception:
    CORS = None
import os
import datetime
import json

app = Flask(__name__)
if CORS:
    # allow cross-origin requests from common local dev origins and enable credentials
    # When credentials are used, Access-Control-Allow-Origin must be the request origin (not '*').
    CORS(app, supports_credentials=True,
         resources={r"/api/*": {"origins": [
             "http://127.0.0.1:5500",
             "http://localhost:5500",
             "http://127.0.0.1:8000",
             "http://localhost:8000",
             "http://localhost:5000"
         ]}})

LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

@app.route('/api/upload-log', methods=['POST'])
def upload_log():
    # Accept JSON payload { records: [...] } or a JSON array
    data = None
    if request.is_json:
        data = request.get_json()
    else:
        raw = request.data
        if not raw:
            return jsonify({ 'ok': False, 'error': 'empty_body' }), 400
        try:
            data = json.loads(raw.decode('utf-8'))
        except Exception as e:
            return jsonify({ 'ok': False, 'error': 'invalid_json', 'detail': str(e) }), 400

    records = []
    if isinstance(data, dict) and 'records' in data and isinstance(data['records'], list):
        records = data['records']
    elif isinstance(data, list):
        records = data
    else:
        return jsonify({ 'ok': False, 'error': 'unexpected_format' }), 400

    # Append each record as a JSONL line
    fname = datetime.datetime.utcnow().strftime('%Y%m%d') + '.log'
    path = os.path.join(LOG_DIR, fname)
    try:
        with open(path, 'a', encoding='utf-8') as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
    except Exception as e:
        return jsonify({ 'ok': False, 'error': 'write_failed', 'detail': str(e) }), 500

    return jsonify({ 'ok': True, 'saved': len(records) })


@app.route('/api/upload-hitmap', methods=['POST'])
def upload_hitmap():
    # Accept JSON payload { records: [...] } or a JSON array
    data = None
    if request.is_json:
        data = request.get_json()
    else:
        raw = request.data
        if not raw:
            return jsonify({ 'ok': False, 'error': 'empty_body' }), 400
        try:
            data = json.loads(raw.decode('utf-8'))
        except Exception as e:
            return jsonify({ 'ok': False, 'error': 'invalid_json', 'detail': str(e) }), 400

    records = []
    if isinstance(data, dict) and 'records' in data and isinstance(data['records'], list):
        records = data['records']
    elif isinstance(data, list):
        records = data
    else:
        return jsonify({ 'ok': False, 'error': 'unexpected_format' }), 400

    fname = 'hitmap-' + datetime.datetime.utcnow().strftime('%Y%m%d') + '.log'
    path = os.path.join(LOG_DIR, fname)
    try:
        with open(path, 'a', encoding='utf-8') as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
    except Exception as e:
        return jsonify({ 'ok': False, 'error': 'write_failed', 'detail': str(e) }), 500

    return jsonify({ 'ok': True, 'saved': len(records) })

if __name__ == '__main__':
    # Development server, do not use in production
    app.run(host='0.0.0.0', port=5000, debug=True)
