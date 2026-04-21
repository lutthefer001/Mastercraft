import os
import requests
from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from dotenv import load_dotenv
import math
import json

load_dotenv()

class SupabaseREST:
    def __init__(self, url, key):
        self.url = url
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    def table(self, db_table):
        return SupabaseTableCall(self, db_table)

class SupabaseTableCall:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.action = None
        self.payload = None
        self.filter = None
        self.order_col = None
        self.order_desc = False
    
    def select(self, selection='*'):
        self.action = 'GET'
        return self
        
    def insert(self, payload):
        self.action = 'POST'
        self.payload = payload
        return self
        
    def update(self, payload):
        self.action = 'PATCH'
        self.payload = payload
        return self
        
    def delete(self):
        self.action = 'DELETE'
        return self
        
    def eq(self, column, value):
        self.filter = f"?{column}=eq.{value}"
        return self

    def order(self, column, desc=False):
        self.order_col = column
        self.order_desc = desc
        return self

    def execute(self):
        endpoint = f"{self.client.url}/rest/v1/{self.table}"
        params = []
        if self.filter: 
            endpoint += self.filter
        else:
            params.append("select=*")
        
        if self.order_col:
            params.append(f"order={self.order_col}.{'desc' if self.order_desc else 'asc'}")
        
        if params:
            endpoint += ("?" if "?" not in endpoint else "&") + "&".join(params)
        
        req_headers = self.client.headers.copy()
        
        try:
            if self.action == 'GET':
                res = requests.get(endpoint, headers=req_headers)
            elif self.action == 'POST':
                res = requests.post(endpoint, headers=req_headers, json=self.payload)
            elif self.action == 'PATCH':
                res = requests.patch(endpoint, headers=req_headers, json=self.payload)
            elif self.action == 'DELETE':
                res = requests.delete(endpoint, headers=req_headers)

            class Result:
                def __init__(self, data):
                    self.data = data
            
            if res.status_code >= 400:
                raise Exception(res.text)
            try:
                return Result(res.json())
            except:
                return Result([])
        except Exception as e:
            print("Supabase xatosi:", e)
            raise

app = Flask(__name__)
app.secret_key = 'mastercraft_secret_session_key'

url: str = os.environ.get("VITE_SUPABASE_URL", "")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

try:
    if url and key:
        supabase = SupabaseREST(url, key)
    else:
        supabase = None
except Exception as e:
    print(e)
    supabase = None

SERVER_IP = 'mc.mastercraft.uz'

import time

# Simple cache system
CACHE = {
    'items': None,
    'last_sync': 0
}

def get_cached_items():
    global supabase
    now = time.time()
    
    # Force re-check environment variables if supabase is missing
    if supabase is None:
        u = os.environ.get("VITE_SUPABASE_URL", "").strip()
        k = os.environ.get("VITE_SUPABASE_ANON_KEY", "").strip()
        if u and k:
            try:
                supabase = SupabaseREST(u, k)
                print(f"INFO: Supabase re-initialized with keys from ENV.")
            except Exception as e:
                print(f"CRITICAL: Failed to re-init Supabase: {str(e)}")
        else:
            print(f"CRITICAL: Environment variables missing on Vercel! URL:{bool(u)}, KEY:{bool(k)}")

    # Cache for 60 seconds
    if CACHE['items'] is None or (now - CACHE['last_sync'] > 60):
        if supabase:
            try:
                print(f"INFO: Attempting to fetch items from Supabase REST API...")
                res = supabase.table('items').select('*').order('id', desc=False).execute()
                if res and res.data:
                    CACHE['items'] = res.data
                    CACHE['last_sync'] = now
                    print(f"INFO: Successfully loaded {len(res.data)} items.")
                else:
                    print(f"WARNING: Supabase returned empty data. Response: {res}")
                    CACHE['items'] = []
            except Exception as e:
                print(f"ERROR: Exception during database fetch: {str(e)}")
                return CACHE['items'] or []
        else:
            print("ERROR: Supabase integration disabled because of missing configuration.")
            return []
            
    return CACHE['items'] or []

@app.context_processor
def inject_globals():
    user = session.get('user')
    if user:
        name = user['name']
        hash_val = sum(ord(c) for c in name)
        coins = 1000 + (hash_val * 45) % 90000
        tokens = (hash_val * 7) % 500
        
        rankList = ['PLAYER', 'VIP', 'VIP+', 'LEGEND', 'DONATOR', 'GOLD', 'NITRO', 'COMET (YT)', 'HERO', 'ULTRA', 'PRIME']
        p_rank = rankList[hash_val % len(rankList)]
        
        kitList = ["Yo'q", 'WARRIOR Kit', 'BRUTE Kit', 'MINER Kit', 'ARCHER Kit', 'BUILDER Kit', 'VIP Kit', 'PRIME Kit']
        active_kit = kitList[(hash_val * 19) % len(kitList)]
        
        return {
            'user': {
                'name': name,
                'p_rank': p_rank,
                'coins': f"{coins:,}",
                'tokens': tokens,
                'active_kit': active_kit,
                'pending_items': [] 
            },
            'server_ip': SERVER_IP,
            'is_admin_page': request.path.startswith('/admin')
        }
    return {'user': None, 'server_ip': SERVER_IP, 'is_admin_page': request.path.startswith('/admin')}

@app.route('/')
def home():
    comments = []
    if supabase:
        try:
            res = supabase.table('comments').select('*').order('created_at', desc=True).execute()
            comments = res.data
        except:
            pass
    return render_template('index.html', comments=comments, server_ip=SERVER_IP)

import urllib.parse

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        name = request.form.get('name').strip()
        safe_name = urllib.parse.quote(name)
        
        session['user'] = {
            'name': name,
            'avatar': f'https://mc-heads.net/avatar/{safe_name}/100',
            'bodyUrl': f'https://mc-heads.net/player/body/{safe_name}/400'
        }
        return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('home'))

@app.route('/admin_logout', methods=['POST'])
def admin_logout():
    session.pop('is_admin', None)
    return redirect(url_for('home'))

@app.route('/kits')
def kits():
    ranks = []
    color_map = {
        'PRIME': '#ff5555', 'ULTRA': '#ffff55', 'HERO': '#ff5555',
        'COMET': '#aa00aa', 'NITRO': '#5555ff', 'GOLD': '#ffaa00',
        'DONATOR': '#aaaaaa', 'LEGEND': '#55ffff', 'VIP+': '#ffaa00',
        'VIP': '#55ff55', 'PLAYER': '#aaaaaa'
    }
    
    all_i = get_cached_items()
    for i in all_i:
        name = str(i.get('name', ''))
        if name.startswith('KIT::'):
            display_name = name.replace('KIT::', '')
            raw_icon = i.get('icon', 'star')
            
            if '|' in raw_icon:
                item_color, item_icon = raw_icon.split('|', 1)
            else:
                item_color = color_map.get(display_name.split()[0].upper(), '#00ffff')
                item_icon = raw_icon
            
            ranks.append({
                'id': i.get('id'),
                'name': display_name,
                'price': i.get('price', ''),
                'color': item_color,
                'icon': item_icon,
                'desc': i.get('description', '')
            })
    return render_template('kits.html', ranks=ranks)

@app.route('/store')
def store():
    items = []
    all_d = get_cached_items()
    for i in all_d:
        if not str(i.get('name', '')).startswith('KIT::'):
            raw_icon = i.get('icon', '💎')
            if '|' in raw_icon:
                item_color, item_icon = raw_icon.split('|', 1)
            else:
                item_color = 'var(--neon-green)'
                item_icon = raw_icon
            
            i['color'] = item_color
            i['icon'] = item_icon
            items.append(i)
    return render_template('store.html', items=items)

@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if not session.get('is_admin'):
        if request.method == 'POST':
            if request.form.get('login') == 'mastercraft' and request.form.get('password') == 'mcboylar':
                session['is_admin'] = True
                return redirect(url_for('admin'))
            else:
                return render_template('admin_login.html', error="Xato login yoki parol!")
        return render_template('admin_login.html')
    
    tab = request.args.get('tab', 'store')
    items, orders, kits = [], [], []
    if supabase:
        try:
            all_i = supabase.table('items').select('*').order('id', desc=True).execute().data
            for i in all_i:
                raw_icon = i.get('icon', '💎')
                if '|' in raw_icon:
                    i['color'], i['icon'] = raw_icon.split('|', 1)
                else:
                    i['color'] = '#00ffff'
                
                if i['name'].startswith('KIT::'):
                    i['display_name'] = i['name'].replace('KIT::', '')
                    kits.append(i)
                else:
                    items.append(i)
            
            orders = supabase.table('orders').select('*').order('id', desc=True).execute().data
        except: pass
    return render_template('admin.html', items=items, orders=orders, kits=kits, tab=tab)

# API Routes
@app.route('/api/stats')
def api_stats():
    try:
        res = requests.get(f'https://api.mcstatus.io/v2/status/java/{SERVER_IP}', timeout=3)
        data = res.json()
        return jsonify({
            'online': data.get('online', False),
            'players': data.get('players', {}).get('online', 0),
            'max': data.get('players', {}).get('max', 100)
        })
    except:
        return jsonify({'online': False, 'players': 0, 'max': 0})
        
@app.route('/api/comment', methods=['POST'])
def add_comment():
    if not supabase: return jsonify({'error': 'Supabase ma\'lumotlar bazasi topilmadi!'}), 500
    if not session.get('user'): return jsonify({'error': 'Akkauntga kiring!'}), 401
    content = request.json.get('content')
    try:
        supabase.table('comments').insert({
            'content': content,
            'user_name': session['user']['name'],
            'user_avatar': session['user']['avatar']
        }).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/buy', methods=['POST'])
def api_buy():
    if not supabase: return jsonify({'error': 'Supabase ma\'lumotlar bazasi topilmadi!'}), 500
    if not session.get('user'): return jsonify({'error': 'Avval login qiling!'}), 401
    item_name = request.json.get('item_name')
    price = request.json.get('price')
    try:
        supabase.table('orders').insert({
            'player_name': session['user']['name'],
            'item_name': item_name,
            'price': price,
            'status': 'Kutilmoqda'
        }).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/<action>', methods=['POST'])
def api_admin(action):
    if not supabase: return jsonify({'error': 'Supabase ma\'lumotlar bazasi topilmadi!'}), 500
    if not session.get('is_admin'): return jsonify({'error': 'Siz Admin emassiz!'}), 401
    try:
        if action == 'add_item':
            supabase.table('items').insert({
                'name': request.json.get('name'),
                'price': request.json.get('price'),
                'description': request.json.get('description'),
                'icon': request.json.get('icon', '💎')
            }).execute()
        elif action == 'delete_item':
            supabase.table('items').delete().eq('id', request.json.get('id')).execute()
        elif action == 'complete_order':
            supabase.table('orders').update({'status': 'Bajarildi'}).eq('id', request.json.get('id')).execute()
        elif action == 'delete_order':
            supabase.table('orders').delete().eq('id', request.json.get('id')).execute()
        elif action == 'delete_comment':
            supabase.table('comments').delete().eq('id', request.json.get('id')).execute()
        elif action == 'give_item':
            supabase.table('orders').insert({
                'player_name': request.json.get('player'),
                'item_name': request.json.get('item'),
                'price': 'TEKINGA',
                'status': 'Bajarildi'
            }).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/debug-db')
def debug_db():
    if not session.get('is_admin'): return "Admin emassiz! Avval admin panelga login qiling."
    u = os.environ.get("VITE_SUPABASE_URL", "TOPILMADI")
    k = os.environ.get("VITE_SUPABASE_ANON_KEY", "TOPILMADI")
    status = "ULANGAN" if supabase else "ULANMAGAN"
    return f"<b>Status:</b> {status} <br/> <b>URL:</b> {u[:15]}... <br/> <b>Key Start:</b> {k[:10]}..."

@app.route('/api/search_player')
def search_player():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({'error': 'No name provided'}), 400
    
    safe_name = urllib.parse.quote(name)
        
    return jsonify({
        'name': name,
        'avatar': f'https://mc-heads.net/avatar/{safe_name}/100',
        'bodyUrl': f'https://mc-heads.net/player/body/{safe_name}/400',
        'p_rank': 'PLAYER', # Mocking some defaults for search view, could query DB too
        'active_kit': "Yo'q"  
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
