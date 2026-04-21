import os
from dotenv import load_dotenv
import requests

load_dotenv("d:/Mastercraft/.env")
url = os.environ.get("VITE_SUPABASE_URL", "")
key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

ranks = [
    {'name': 'KIT::PRIME', 'price': '200,000 UZS', 'description': "ENG ZO'RI! Serverdagi eng kuchli kit va VIP imkoniyatlar (Butunlay / 30 Kun).", 'icon': 'crown'},
    {'name': 'KIT::ULTRA', 'price': '100,000 UZS', 'description': "Cheksiz imtiyozlarga yaqinlashuvchi Ultra kit.", 'icon': 'zap'},
    {'name': 'KIT::HERO', 'price': '79,000 UZS', 'description': "Server qahramonlari uchun kuchli qurollar kiti.", 'icon': 'swords'},
    {'name': 'KIT::COMET / YT', 'price': '56,000 UZS', 'description': "YouTuberlar va faollar uchun. Comet kit.", 'icon': 'server'},
    {'name': 'KIT::NITRO', 'price': '43,000 UZS', 'description': "Tezkor rivojlanish uchun Nitro kiti va prefix.", 'icon': 'zap'},
    {'name': 'KIT::GOLD', 'price': '35,000 UZS', 'description': "Oltin rank! Ajoyib imkoniyatlar va qimmatbaho kit.", 'icon': 'gem'},
    {'name': 'KIT::DONATOR', 'price': '28,000 UZS', 'description': "Server rivojiga yordam berganlar uchun kuchli kit.", 'icon': 'package'},
    {'name': 'KIT::LEGEND', 'price': '21,000 UZS', 'description': "Afsonaviy o'yinchilar uchun maxsus buyumlar.", 'icon': 'shield'},
    {'name': 'KIT::VIP+', 'price': '13,000 UZS', 'description': "VIP dan ko'proq imkoniyatlar va yaxshiroq kit.", 'icon': 'award'},
    {'name': 'KIT::VIP', 'price': '6,000 UZS', 'description': "VIP imtiyozlari, maxsus kit va chat ranglari.", 'icon': 'star'},
    {'name': 'KIT::PLAYER', 'price': 'BEPUL', 'description': "Boshlang'ich o'yinchi kiti va huquqlari.", 'icon': 'user'},

    # Shop Kits (They go to Do'kon so no KIT:: prefix, or put KIT:: so they show up in Kits?)
    {'name': 'WARRIOR Kit', 'price': '15,000 COIN', 'description': "Jang maydonlari uchun xavfli jangchi kiti. Temir/Olmos aralash sovut va kuchli qilich.", 'icon': 'swords'},
    {'name': 'BRUTE Kit', 'price': '25,000 COIN', 'description': "Buzib bo'lmaydigan darajadagi himoya. Judayam qattiq chidamli tank kiti.", 'icon': 'shield'},
    {'name': 'MINER Kit', 'price': '10,000 COIN', 'description': "Shaxtyorlar uchun maxsus. Samaradorlik borasida eng zo'r asboblar to'plami.", 'icon': 'gem'},
    {'name': 'ARCHER Kit', 'price': '18,000 COIN', 'description': "Uzoqdan zarba berish ustasi. O'tkir kamon o'qlari va tezlik iksiri.", 'icon': 'zap'},
    {'name': 'BUILDER Kit', 'price': '8,000 COIN', 'description': "Ajoyib binolar qurish uchun kerakli asosiy resurs va asboblar kiti.", 'icon': 'package'},
    
    # Pre-populate keys
    {'name': 'Oddiy Kalit x1', 'price': '1,000 UZS', 'description': "Omad qutisiga oddiy kalit.", 'icon': 'key'},
    {'name': 'Premium Kalit x3', 'price': '15,000 UZS', 'description': "Eng yaxshi drop tushish uchun maxsus kalit.", 'icon': 'key'}
]

for item in ranks:
    res = requests.post(f"{url}/rest/v1/items", headers=headers, json=item)
    print(res.status_code, item['name'])
