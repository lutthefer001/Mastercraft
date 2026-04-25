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

def get_user_orders(username):
    global supabase
    if not supabase: return []
    try:
        res = supabase.table('orders').select('*').eq('player_name', username).execute()
        return res.data if res and res.data else []
    except:
        return []

@app.context_processor
def inject_globals():
    user = session.get('user')
    if user:
        name = user['name']
        all_cached = get_cached_items()
        
        user_record = next((i for i in all_cached if i['name'] == f"USER::{name}"), None)
        coins, tokens = 0, 0
        if user_record:
            price_field = str(user_record.get('price', '0|0'))
            if '|' in price_field:
                try:
                    c, t = price_field.split('|', 1)
                    coins, tokens = int(c), int(t)
                except: pass
        else:
            # Fallback for mock if not in db
            hash_val = sum(ord(c) for c in name)
            coins = 1000 + (hash_val * 45) % 90000
            tokens = (hash_val * 7) % 500

        hash_val = sum(ord(c) for c in name)
        rankList = ['PLAYER', 'VIP', 'VIP+', 'LEGEND', 'DONATOR', 'GOLD', 'NITRO', 'COMET (YT)', 'HERO', 'ULTRA', 'PRIME']
        p_rank = rankList[hash_val % len(rankList)]
        
        kitList = ["Yo'q", 'WARRIOR Kit', 'BRUTE Kit', 'MINER Kit', 'ARCHER Kit', 'BUILDER Kit', 'VIP Kit', 'PRIME Kit']
        active_kit = kitList[(hash_val * 19) % len(kitList)]
        
        pending_items = []
        user_orders = get_user_orders(name)
        
        all_cached = get_cached_items()
        kit_names = [i['name'].replace('KIT::', '') for i in all_cached if str(i.get('name', '')).startswith('KIT::')]
        
        for o in user_orders:
            item_n = o.get('item_name', '')
            if o.get('status') != 'Bajarildi':
                pending_items.append(o)
            else:
                is_kit = (item_n in kit_names) or any(k in item_n.upper() for k in ['KIT', 'VIP', 'RANK', 'MVP', 'HERO', 'ULTRA', 'PRIME', 'LEGEND', 'COMET', 'NITRO', 'GOLD'])
                if is_kit:
                    active_kit = item_n
                    p_rank = item_n.replace(' Kit', '').replace(' KIT', '').replace(' kit', '')

        return {
            'user': {
                'name': name,
                'p_rank': p_rank,
                'coins': f"{coins:,}",
                'tokens': tokens,
                'active_kit': active_kit,
                'pending_items': pending_items
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
        action = request.form.get('action', 'login')
        name = request.form.get('name').strip()
        password = request.form.get('password', '').strip()
        safe_name = urllib.parse.quote(name)
        
        if not supabase:
            return render_template('login.html', error="Ma'lumotlar bazasi ulanmagan!")

        user_key = f"USER::{name}"
        try:
            res = supabase.table('items').select('*').eq('name', user_key).execute()
        except:
            return render_template('login.html', error="Tarmoqda xatolik!")
            
        if action == 'register':
            if res.data:
                return render_template('login.html', error="Bunday ism band! Boshqa ism tanlang.")
            
            try:
                supabase.table('items').insert({
                    'name': user_key,
                    'description': password,
                    'price': '0|0',
                    'icon': f'https://api.dicebear.com/9.x/pixel-art/svg?seed={safe_name}'
                }).execute()
            except Exception as e:
                return render_template('login.html', error=f"Xatolik: {e}")
                
            session['user'] = {
                'name': name,
                'avatar': f'https://api.dicebear.com/9.x/pixel-art/svg?seed={safe_name}',
                'bodyUrl': f'https://api.dicebear.com/9.x/adventurer/svg?seed={safe_name}'
            }
            return redirect(url_for('home'))
            
        elif action == 'login':
            if not res.data:
                return render_template('login.html', error="Foydalanuvchi topilmadi! Avval ro'yxatdan o'ting.")
            
            user_data = res.data[0]
            if user_data.get('description') != password:
                return render_template('login.html', error="Parol noto'g'ri!")
            
            session['user'] = {
                'name': name,
                'avatar': f'https://api.dicebear.com/9.x/pixel-art/svg?seed={safe_name}',
                'bodyUrl': f'https://api.dicebear.com/9.x/adventurer/svg?seed={safe_name}'
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
                
            if 'http' in item_icon:
                icon_type = 'image'
            elif any(ord(c) > 127 for c in item_icon) or len(item_icon) < 3:
                icon_type = 'emoji'
            else:
                icon_type = 'lucide'
            
            ranks.append({
                'id': i.get('id'),
                'name': display_name,
                'price': i.get('price', ''),
                'color': item_color,
                'icon': item_icon,
                'icon_type': icon_type,
                'desc': i.get('description', '')
            })
    return render_template('kits.html', ranks=ranks)

@app.route('/store')
def store():
    items = []
    all_d = get_cached_items()
    for i in all_d:
        name = str(i.get('name', ''))
        if not name.startswith('KIT::') and not name.startswith('USER::') and not name.startswith('ADMIN::') and not name.startswith('PROMO::') and not name.startswith('MONEY::'):
            raw_icon = i.get('icon', '💎')
            if '|' in raw_icon:
                item_color, item_icon = raw_icon.split('|', 1)
            else:
                item_color = 'var(--neon-green)'
                item_icon = raw_icon
                
            if 'http' in item_icon:
                icon_type = 'image'
            elif any(ord(c) > 127 for c in item_icon) or len(item_icon) < 3:
                icon_type = 'emoji'
            else:
                icon_type = 'lucide'
            
            i['color'] = item_color
            i['icon'] = item_icon
            i['icon_type'] = icon_type
            items.append(i)
    return render_template('store.html', items=items)

@app.route('/moneyshop')
def moneyshop():
    items = []
    all_d = get_cached_items()
    for i in all_d:
        name = str(i.get('name', ''))
        if name.startswith('MONEY::'):
            display_name = name.replace('MONEY::', '')
            raw_icon = i.get('icon', '💎')
            if '|' in raw_icon:
                item_color, item_icon = raw_icon.split('|', 1)
            else:
                item_color = 'var(--neon-green)'
                item_icon = raw_icon
            
            icon_type = 'icon'
            if item_icon.startswith('http'):
                icon_type = 'image'
            elif len(item_icon) <= 2 and not item_icon.isascii():
                icon_type = 'emoji'
                
            items.append({
                'id': i.get('id'),
                'raw_name': name,
                'name': display_name,
                'price': i.get('price', ''),
                'color': item_color,
                'icon': item_icon,
                'icon_type': icon_type,
                'desc': i.get('description', '')
            })
    return render_template('moneyshop.html', items=items)

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
    items, orders, kits, admins, promos, registered_users, moneyshop_items = [], [], [], [], [], [], []
    if supabase:
        try:
            all_i = supabase.table('items').select('*').order('id', desc=True).execute().data
            for i in all_i:
                if i['name'].startswith('USER::'):
                    i['display_name'] = i['name'].replace('USER::', '')
                    registered_users.append(i)
                    continue
                elif i['name'].startswith('ADMIN::'):
                    i['display_name'] = i['name'].replace('ADMIN::', '')
                    admins.append(i)
                    continue
                elif i['name'].startswith('PROMO::'):
                    i['display_name'] = i['name'].replace('PROMO::', '')
                    promos.append(i)
                    continue
                    
                raw_icon = i.get('icon', '💎')
                if '|' in raw_icon:
                    i['color'], i['icon'] = raw_icon.split('|', 1)
                else:
                    i['color'] = '#00ffff'
                    
                if 'http' in i['icon']:
                    i['icon_type'] = 'image'
                elif any(ord(c) > 127 for c in i['icon']) or len(i['icon']) < 3:
                    i['icon_type'] = 'emoji'
                else:
                    i['icon_type'] = 'lucide'
                
                if i['name'].startswith('KIT::'):
                    i['display_name'] = i['name'].replace('KIT::', '')
                    kits.append(i)
                elif i['name'].startswith('PROMO::'):
                    i['display_name'] = i['name'].replace('PROMO::', '')
                    promos.append(i)
                elif i['name'].startswith('MONEY::'):
                    i['display_name'] = i['name'].replace('MONEY::', '')
                    moneyshop_items.append(i)
                else:
                    items.append(i)
            
            orders = supabase.table('orders').select('*').order('id', desc=True).execute().data
        except: pass
    return render_template('admin.html', items=items, orders=orders, kits=kits, admins=admins, promos=promos, users=registered_users, moneyshop_items=moneyshop_items, tab=tab)

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

@app.route('/api/buy', methods=['POST', 'OPTIONS'])
def api_buy():
    if request.method == 'OPTIONS':
        return jsonify({'success': True})
    if not supabase: return jsonify({'error': 'Supabase ma\'lumotlar bazasi topilmadi!'}), 500
    if not session.get('user'): return jsonify({'error': 'Avval login qiling!'}), 401
    
    item_name = request.json.get('item_name')
    price_str = request.json.get('price', '')
    method = request.json.get('method', 'card')
    user_name = session['user']['name']
    
    try:
        user_res = supabase.table('items').select('*').eq('name', f"USER::{user_name}").execute()
        if not user_res.data:
            return jsonify({'error': 'Foydalanuvchi topilmadi!'}), 404
        
        user_record = user_res.data[0]
        price_field = str(user_record.get('price', '0|0'))
        c, t = 0, 0
        if '|' in price_field:
            try:
                c, t = int(price_field.split('|')[0]), int(price_field.split('|')[1])
            except: pass
        
        if method == 'balance':
            # Balance purchase
            cost = int(''.join(filter(str.isdigit, price_str)))
            if 'COIN' in price_str.upper():
                if c < cost: return jsonify({'error': 'COIN yetarli emas!'}), 400
                c -= cost
            elif 'TOKEN' in price_str.upper():
                if t < cost: return jsonify({'error': 'TOKEN yetarli emas!'}), 400
                t -= cost
            else:
                return jsonify({'error': 'Noto\'g\'ri valyuta!'}), 400
            
            # Update balance
            supabase.table('items').update({'price': f"{c}|{t}"}).eq('id', user_record['id']).execute()
            
            # If buying COIN or TOKEN using Balance
            if 'COIN' in item_name.upper() or 'TOKEN' in item_name.upper():
                amount = int(''.join(filter(str.isdigit, item_name)))
                if 'COIN' in item_name.upper():
                    c += amount
                else:
                    t += amount
                supabase.table('items').update({'price': f"{c}|{t}"}).eq('id', user_record['id']).execute()
                supabase.table('orders').insert({
                    'player_name': user_name,
                    'item_name': item_name,
                    'price': price_str,
                    'status': 'Bajarildi'
                }).execute()
                return jsonify({'success': True, 'new_balance': f"{c}|{t}"})
            
            # Regular store item
            supabase.table('orders').insert({
                'player_name': user_name,
                'item_name': item_name,
                'price': price_str,
                'status': 'Kutilmoqda' # Still needs admin approval or system processing
            }).execute()
            return jsonify({'success': True, 'new_balance': f"{c}|{t}"})
            
        else:
            # Card purchase
            # If buying COIN or TOKEN, credit immediately
            if 'COIN' in item_name.upper() or 'TOKEN' in item_name.upper():
                amount = int(''.join(filter(str.isdigit, item_name)))
                if 'COIN' in item_name.upper(): c += amount
                if 'TOKEN' in item_name.upper(): t += amount
                
                supabase.table('items').update({'price': f"{c}|{t}"}).eq('id', user_record['id']).execute()
                
                # Record as Bajarildi
                supabase.table('orders').insert({
                    'player_name': user_name,
                    'item_name': item_name,
                    'price': price_str,
                    'status': 'Bajarildi'
                }).execute()
                return jsonify({'success': True})
            else:
                # Regular store item via Card
                supabase.table('orders').insert({
                    'player_name': user_name,
                    'item_name': item_name,
                    'price': price_str,
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
        elif action == 'add_admin':
            # Store admin in items table with ADMIN:: prefix
            supabase.table('items').insert({
                'name': f"ADMIN::{request.json.get('login')}",
                'description': request.json.get('password'),
                'price': '0',
                'icon': 'shield'
            }).execute()
        elif action == 'add_promo':
            supabase.table('items').insert({
                'name': f"PROMO::{request.json.get('code')}",
                'description': request.json.get('discount'),
                'price': '0',
                'icon': 'ticket'
            }).execute()
        elif action == 'delete_item':
            supabase.table('items').delete().eq('id', request.json.get('id')).execute()
        elif action == 'edit_item':
            supabase.table('items').update({
                'name': request.json.get('name'),
                'price': request.json.get('price'),
                'description': request.json.get('description'),
                'icon': request.json.get('icon')
            }).eq('id', request.json.get('id')).execute()
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

@app.route('/api/admin/users', methods=['POST'])
def admin_update_user():
    if not session.get('is_admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    username = data.get('username')
    coins = data.get('coins')
    tokens = data.get('tokens')
    
    if not username:
        return jsonify({'error': 'Username is required'})
        
    try:
        user_record = supabase.table('items').select('*').eq('name', f"USER::{username}").execute()
        if not user_record.data:
            return jsonify({'error': 'Foydalanuvchi topilmadi'})
            
        uid = user_record.data[0]['id']
        new_price = f"{coins}|{tokens}"
        
        supabase.table('items').update({'price': new_price}).eq('id', uid).execute()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)})

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
        'avatar': f'https://api.dicebear.com/9.x/pixel-art/svg?seed={safe_name}',
        'bodyUrl': f'https://api.dicebear.com/9.x/adventurer/svg?seed={safe_name}',
        'p_rank': 'PLAYER', # Mocking some defaults for search view, could query DB too
        'active_kit': "Yo'q"  
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
