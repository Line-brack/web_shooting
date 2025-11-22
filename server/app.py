from flask import Flask, request, jsonify
try:
    from flask_cors import CORS
except Exception:
    CORS = None
import os
import datetime
import json
import glob
from flask import Response, send_from_directory

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


def _load_all_hitmap_records():
        files = sorted(glob.glob(os.path.join(LOG_DIR, 'hitmap-*.log')))
        records = []
        for path in files:
                try:
                        with open(path, 'r', encoding='utf-8') as fh:
                                for line in fh:
                                        line = line.strip()
                                        if not line:
                                                continue
                                        try:
                                                records.append(json.loads(line))
                                        except Exception:
                                                continue
                except Exception:
                        continue
        return records


@app.route('/api/hitmap-data', methods=['GET'])
def api_hitmap_data():
    """Return aggregated hit records as JSON. Limits to the most recent 5000 records."""
    records = _load_all_hitmap_records()
    if len(records) > 5000:
        records = records[-5000:]
    return jsonify(records)


@app.route('/hitmap', methods=['GET'])
def hitmap_static():
    """Serve the static hitmap viewer HTML located in ./static/hitmap.html."""
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    return send_from_directory(static_dir, 'hitmap.html')

if __name__ == '__main__':
    # Development server, do not use in production
    app.run(host='0.0.0.0', port=5000, debug=True)
