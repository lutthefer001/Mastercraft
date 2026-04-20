import React, { useEffect, useState } from 'react';
import { createClient } from './lib/supabase';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Server, 
  Settings, 
  Zap, 
  ArrowRight, 
  LogIn, 
  LogOut, 
  User, 
  ShieldCheck, 
  Copy, 
  CheckCircle,
  Users,
  Wifi,
  Crown,
  Star,
  Swords,
  Shield,
  Gem,
  Award,
  Package,
  Store,
  Wallet,
  Search
} from 'lucide-react';

const supabase = createClient();

// --- AUTH LOGIC ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const savedUser = localStorage.getItem('mc_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (name) => {
    let uuid = name;
    try {
      const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`);
      if (res.ok) {
        const data = await res.json();
        if (data.uuid) uuid = data.uuid.replace(/-/g, '');
      }
    } catch(e) {}
    
    const newUser = { 
      name, 
      avatar: `https://visage.surgeplay.com/face/100/${uuid}?y=0`, 
      bodyUrl: `https://visage.surgeplay.com/full/400/${uuid}?y=-40`
    };
    localStorage.setItem('mc_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('mc_user');
    window.location.reload();
  };

  return { user, login, logout };
};

// --- REAL-TIME STATS ---
const useServerStats = (ip) => {
  const [stats, setStats] = useState({ online: false, players: 0, max: 0 });
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`https://api.mcstatus.io/v2/status/java/${ip}`);
        const data = await res.json();
        setStats({
          online: data.online,
          players: data.players?.online || 0,
          max: data.players?.max || 100
        });
      } catch (e) {}
    };
    fetchStats();
    // REAL-TIME YANGILANISH (Har 10 soniyada)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [ip]);
  return stats;
};

// --- PROFILE MODAL ---
const ProfileModal = ({ user, onClose, logout }) => {
  const [dbOrders, setDbOrders] = useState([]);

  useEffect(() => {
    supabase.from('orders').select('*').eq('player_name', user.name).then(({data}) => {
       if(data) setDbOrders(data);
    });
  }, [user.name]);

  if (!user) return null;

  const hash = user.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const coins = 1000 + (hash * 45) % 90000;
  const tokens = (hash * 7) % 500;
  const kills = (hash * 3) % 2000;
  const playtime = (hash * 13) % 500; // in hours
  
  const rankList = ['PLAYER', 'VIP', 'VIP+', 'LEGEND', 'DONATOR', 'GOLD', 'NITRO', 'COMET (YT)', 'HERO', 'ULTRA', 'PRIME'];
  let pRank = rankList[hash % rankList.length];
  
  const kitList = ["Yo'q", 'WARRIOR Kit', 'BRUTE Kit', 'MINER Kit', 'ARCHER Kit', 'BUILDER Kit', 'VIP Kit', 'PRIME Kit'];
  let activeKit = kitList[(hash * 19) % kitList.length];

  // REWRITE FROM REAL DATABASE ORDERS
  const rankNames = ['VIP', 'VIP+', 'LEGEND', 'DONATOR', 'GOLD', 'NITRO', 'COMET / YT', 'HERO', 'ULTRA', 'PRIME'];
  const kitNames = ['WARRIOR', 'BRUTE', 'MINER', 'ARCHER', 'BUILDER'];
  
  const approvedItems = dbOrders.filter(o => o.status === 'Bajarildi').reverse();
  const pendingItems = dbOrders.filter(o => o.status === 'Kutilmoqda');

  const boughtRank = approvedItems.find(o => rankNames.includes(o.item_name));
  const boughtKit = approvedItems.find(o => kitNames.includes(o.item_name) || o.item_name.includes('Kit'));

  if (boughtRank) pRank = boughtRank.item_name;
  if (boughtKit) activeKit = boughtKit.item_name;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="glass animate-float" style={{ padding: '3rem', borderRadius: '30px', width: '800px', display: 'flex', gap: '3rem', position: 'relative', border: '1px solid var(--neon-cyan)' }}>
         <button onClick={onClose} style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'red', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}>&times;</button>
         
         <div style={{ width: '200px', flexShrink: 0, textAlign: 'center' }}>
            <div style={{ padding: '20px', background: 'rgba(0, 255, 255, 0.05)', borderRadius: '20px', border: '1px solid rgba(0, 255, 255, 0.2)', marginBottom: '1.5rem', minHeight: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               <img src={user.bodyUrl || `https://mc-heads.net/body/${user.name}/180`} alt="Player Body" style={{ width: '100%', imageRendering: 'pixelated', filter: 'drop-shadow(0 10px 20px rgba(0,255,255,0.2))' }} />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'Space Grotesk', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--neon-cyan)', overflowWrap: 'break-word' }}>{user.name}</h2>
            <div style={{ display: 'inline-block', padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>{pRank}</div>
         </div>

         <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              SERVERDAGI <span className="text-gradient">PROFILINGIZ</span>
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={16}/> Balans (Coins)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--neon-green)' }}>{coins.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Gem size={16}/> Tokenlar</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffaa00' }}>{tokens}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Crown size={16}/> O'yinchi Rangi</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>{pRank}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px' }}>
                <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={16}/> Faol Kit</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeKit}</div>
              </div>
            </div>

            {pendingItems.length > 0 && (
               <div style={{ background: 'rgba(255,170,0,0.1)', padding: '1rem', borderRadius: '15px', border: '1px solid #ffaa00', marginBottom: '1.5rem' }}>
                 <div style={{ color: '#ffaa00', fontSize: '0.9rem', fontWeight: 'bold' }}>KUTILAYOTGAN XARIDLAR (Adminga yuborilgan)</div>
                 <div style={{ color: '#ccc', marginTop: '5px' }}>{pendingItems.map(o => o.item_name).join(', ')}</div>
               </div>
            )}

            {logout && (
              <button onClick={() => { logout(); onClose(); }} className="btn" style={{ background: 'rgba(255,0,0,0.1)', color: 'red', border: '1px solid red', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <LogOut size={20} /> CHIQISH
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

// --- NAVBAR ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
    {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} logout={logout} />}
    <nav className="glass" style={{ margin: '1rem', borderRadius: '20px', padding: '1.2rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '1rem', zIndex: 1000 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'white' }}>
        <div style={{ padding: '10px', background: 'var(--neon-green)', borderRadius: '12px', color: 'black' }}><Server size={28} /></div>
        <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '2px', fontFamily: 'Space Grotesk' }}>MASTER<span className="text-gradient">CRAFT</span></span>
      </Link>
      
      <div style={{ display: 'flex', gap: '3rem', fontWeight: 700, alignItems: 'center' }}>
        <Link to="/" className={location.pathname === '/' ? "text-gradient" : ""} style={{ textDecoration: 'none', color: location.pathname === '/' ? '' : 'white' }}>HOME</Link>
        <Link to="/kits" className={location.pathname === '/kits' ? "text-gradient" : ""} style={{ textDecoration: 'none', color: location.pathname === '/kits' ? '' : 'white' }}>RANKS & KITS</Link>
        <Link to="/store" className={location.pathname === '/store' ? "text-gradient" : ""} style={{ textDecoration: 'none', color: location.pathname === '/store' ? '' : 'white' }}>STORE</Link>
        {!isAdminPage && <Link to="/admin" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={18} /> ADMIN</Link>}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Agar Admin sahifasida bo'lsak, Login tugmasi umuman ko'rinmaydi */}
        {!isAdminPage && (
          user ? (
            <div 
              onClick={() => setProfileOpen(true)}
              className="glass hover-glow"
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '5px 20px 5px 5px', borderRadius: '30px' }}
            >
               <img src={user.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'none' }} />
               <span style={{ fontWeight: 800 }}>{user.name}</span>
            </div>
          ) : (
            <Link to="/login" className="btn-neon" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, textDecoration: 'none', color: 'black' }}>
              <LogIn size={18} /> PLAYER LOGIN
            </Link>
          )
        )}
        
        {isAdminPage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--neon-cyan)', fontWeight: 800 }}>
             <ShieldCheck size={24} /> SECURE ADMIN SESSION
          </div>
        )}
      </div>
    </nav>
    </>
  );
};

// --- LOGIN PAGE ---
const LoginPage = () => {
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    login(name);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 2rem' }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: '30px', width: '450px', textAlign: 'center' }}>
        <User size={60} style={{ color: 'var(--neon-green)', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>PLAYER <span className="text-gradient">REGISTER</span></h2>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <input className="admin-input" placeholder="O'yindagi ismingiz" value={name} onChange={e => setName(e.target.value)} required />
          <button className="btn btn-neon" type="submit">ENTER SERVER SITE</button>
        </form>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
const AdminPanel = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', icon: '💎' });
  const [adminTab, setAdminTab] = useState('store'); // store or orders

  const handleLogin = (e) => {
    e.preventDefault();
    if(credentials.login === 'Master' && credentials.password === 'masterboy') setIsAuthorized(true);
    else alert("Xato!");
  };

  useEffect(() => { 
    if(isAuthorized) {
       fetchItems(); 
       fetchOrders();
    }
  }, [isAuthorized]);

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  const addItem = async (e) => {
    e.preventDefault();
    await supabase.from('items').insert([newItem]);
    setNewItem({ name: '', price: '', description: '', icon: '💎' });
    fetchItems();
  };

  const deleteItem = async (id) => {
    await supabase.from('items').delete().eq('id', id);
    fetchItems();
  };

  const completeOrder = async (id) => {
    await supabase.from('orders').update({ status: 'Bajarildi' }).eq('id', id);
    fetchOrders();
  };

  const deleteOrder = async (id) => {
    await supabase.from('orders').delete().eq('id', id);
    fetchOrders();
  };

  if(!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 2rem' }}>
        <div className="glass" style={{ padding: '3rem', borderRadius: '24px', width: '400px', textAlign: 'center' }}>
          <ShieldCheck size={60} style={{ color: 'var(--neon-green)', marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '2rem' }}>ADMIN ENTRANCE</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input className="admin-input" placeholder="Login" value={credentials.login} onChange={e => setCredentials({...credentials, login: e.target.value})} />
            <input className="admin-input" type="password" placeholder="Password" value={credentials.password} onChange={e => setCredentials({...credentials, password: e.target.value})} />
            <button className="btn btn-neon" type="submit">LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', maxWidth: '1300px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>ADMIN <span className="text-gradient">PANEL</span></h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
         <button onClick={() => setAdminTab('store')} className="btn" style={{ background: adminTab === 'store' ? 'var(--neon-green)' : 'rgba(255,255,255,0.05)', color: adminTab === 'store' ? '#000' : '#fff' }}>DO'KON TOVARLARI</button>
         <button onClick={() => setAdminTab('orders')} className="btn" style={{ background: adminTab === 'orders' ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)', color: adminTab === 'orders' ? '#000' : '#fff' }}>SOTIB OLINGANLAR (BUYURTMALAR)</button>
      </div>

      {adminTab === 'store' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '24px', height: 'fit-content' }}>
            <h3>NEW PRODUCT</h3>
            <form onSubmit={addItem} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
              <input className="admin-input" placeholder="Kit Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <input className="admin-input" placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
              <textarea className="admin-input" placeholder="Desc" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} required />
              <button className="btn btn-neon" type="submit">ADD TO STORE</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {items.map(i => (
               <div key={i.id} className="glass" style={{ padding: '1.5rem', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div><h3>{i.name}</h3><p className="text-gradient">{i.price}</p></div>
                 <button onClick={() => deleteItem(i.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={24} /></button>
               </div>
             ))}
          </div>
        </div>
      )}

      {adminTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {orders.length === 0 && <p style={{ color: '#888' }}>Hozircha buyurtmalar yo'q!</p>}
           {orders.map(o => (
             <div key={o.id} className="glass" style={{ padding: '1.5rem 2.5rem', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `5px solid ${o.status === 'Bajarildi' ? 'var(--neon-green)' : '#ffaa00'}` }}>
               <div>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--neon-cyan)', marginBottom: '5px' }}>{o.player_name}</h3>
                  <div style={{ display: 'flex', gap: '1rem', color: '#ccc' }}><span>Sotib olyapti: <b>{o.item_name}</b></span><span>Narxi: <b>{o.price}</b></span></div>
                  <div style={{ marginTop: '10px', fontSize: '0.9rem', color: o.status === 'Bajarildi' ? 'var(--neon-green)' : '#ffaa00' }}>Holati: {o.status}</div>
               </div>
               <div style={{ display: 'flex', gap: '15px' }}>
                 {o.status !== 'Bajarildi' && <button onClick={() => completeOrder(o.id)} className="btn btn-neon" style={{ padding: '10px 20px', borderRadius: '10px' }}><CheckCircle size={18} style={{ marginRight: '8px' }}/> BERILDI</button>}
                 <button onClick={() => deleteOrder(o.id)} style={{ color: 'red', background: 'rgba(255,0,0,0.1)', border: 'none', cursor: 'pointer', padding: '15px', borderRadius: '10px' }}><Trash2 size={20} /></button>
               </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

// --- COMMENTS ---
const Comments = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    supabase.from('comments').select('*').order('created_at', { ascending: false }).then(({ data }) => setComments(data || []));
  }, []);

  const postComment = async () => {
    if(!newComment) return;
    await supabase.from('comments').insert([{
      content: newComment,
      user_name: user?.name || 'Anonymous',
      user_avatar: user?.avatar || ''
    }]);
    setNewComment('');
    supabase.from('comments').select('*').order('created_at', { ascending: false }).then(({ data }) => setComments(data || []));
  };

  return (
    <section style={{ maxWidth: '800px', margin: '6rem auto', padding: '0 2rem' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center' }}>PLAYER <span className="text-gradient">LIVE CHAT</span></h2>
      {user && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '4rem' }}>
          <textarea className="admin-input" placeholder="Xabaringizni yozing..." value={newComment} onChange={e => setNewComment(e.target.value)} />
          <button onClick={postComment} className="btn btn-neon" style={{ marginTop: '1rem', width: '100%' }}>SEND MESSAGE</button>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {comments.map(c => (
          <div key={c.id} className="comment-card glass">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <img src={c.user_avatar} style={{ width: '40px', borderRadius: '50%' }} alt="u" />
              <span style={{ fontWeight: 800 }}>{c.user_name}</span>
            </div>
            <p style={{ color: '#ccc' }}>{c.content}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// --- HOME PAGE ---
const LandingPage = () => {
  const [copied, setCopied] = useState(false);
  const serverIp = 'mc.mastercraft.uz';
  const stats = useServerStats(serverIp);
  const [searchName, setSearchName] = useState('');
  const [searchUser, setSearchUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const copyIP = () => {
    navigator.clipboard.writeText(serverIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if(!searchName.trim()) return;
    setIsSearching(true);
    let uuid = searchName;
    try {
      const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${searchName}`);
      if(res.ok) {
        const data = await res.json();
        if(data.uuid) uuid = data.uuid.replace(/-/g, '');
      }
    } catch(e) {}
    
    setSearchUser({
       name: searchName,
       avatar: `https://visage.surgeplay.com/face/100/${uuid}?y=0`,
       bodyUrl: `https://visage.surgeplay.com/full/400/${uuid}?y=-40`
    });
    setIsSearching(false);
  };

  return (
    <div style={{ paddingBottom: '6rem' }}>
      {searchUser && <ProfileModal user={searchUser} onClose={() => setSearchUser(null)} />}
      <header style={{ textAlign: 'center', padding: '12rem 2rem 8rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '30px', background: stats.online ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255,0,0,0.1)', color: stats.online ? 'var(--neon-green)' : 'red', fontWeight: 800, marginBottom: '2rem', border: '1px solid currentColor' }}>
          <Wifi size={20} /> SERVER STATUS: {stats.online ? 'ONLINE' : 'OFFLINE'}
        </div>
        <h1 style={{ fontSize: '9rem', fontWeight: 900, fontFamily: 'Space Grotesk', lineHeight: 0.8 }}>
          MASTER <br/><span className="text-gradient">CRAFT</span>
        </h1>
        
        <div className="glass" onClick={copyIP} style={{ display: 'inline-flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 3.5rem', borderRadius: '25px', marginTop: '5rem', cursor: 'pointer', fontSize: '1.8rem', fontWeight: 800 }}>
          <span style={{ opacity: 0.5 }}>IP:</span> <span>{serverIp}</span> 
          {copied ? <CheckCircle size={35} style={{ color: 'var(--neon-green)' }} /> : <Copy size={35} style={{ opacity: 0.4 }} />}
        </div>

        <form onSubmit={handleSearch} className="glass hover-glow" style={{ margin: '3rem auto 0', maxWidth: '500px', display: 'flex', borderRadius: '30px', padding: '5px', border: '1px solid var(--neon-cyan)', boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)' }}>
           <input 
             value={searchName} 
             onChange={e => setSearchName(e.target.value)} 
             placeholder="O'yinchi ismini qidiring..." 
             className="admin-input" 
             style={{ border: 'none', background: 'transparent', flexGrow: 1, padding: '10px 20px', fontSize: '1.2rem', boxShadow: 'none' }} 
           />
           <button type="submit" className="btn btn-neon" style={{ borderRadius: '25px', display: 'flex', gap: '8px', alignItems: 'center' }}>
             {isSearching ? 'QIDIRILMOQDA...' : <><Search size={20} /> QIDIRISH</>}
           </button>
        </form>

        <div className="hero-stats" style={{ marginTop: '5rem' }}>
          <div className="stat-item">
            <span className="stat-value"><Users size={30} style={{marginRight: '10px'}}/>{stats.players}</span>
            <span className="stat-label">Online Players</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.max}</span>
            <span className="stat-label">Slot Capacity</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Barcha</span>
            <span className="stat-label">Versiyalar (1.8 - 1.21)</span>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: '1300px', margin: '4rem auto', padding: '0 2rem' }}>
         <h2 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '4rem', fontFamily: 'Space Grotesk' }}>SERVER <span className="text-gradient">IMKONIYATLARI</span></h2>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            <div className="glass hover-glow" style={{ padding: '3rem 2rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ padding: '15px', background: 'rgba(57, 255, 20, 0.1)', borderRadius: '15px', marginBottom: '1.5rem', color: 'var(--neon-green)' }}><Award size={40} /></div>
               <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontFamily: 'Space Grotesk', fontWeight: 800 }}>Global Auksion</h3>
               <p style={{ color: '#aaa', lineHeight: 1.6 }}>Eng qimmatli va premium buyumlaringizni boshqa o'yinchilarga erkin narxlarda soting yoki xarid qiling.</p>
            </div>
            
            <div className="glass hover-glow" style={{ padding: '3rem 2rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ padding: '15px', background: 'rgba(0, 255, 255, 0.1)', borderRadius: '15px', marginBottom: '1.5rem', color: 'var(--neon-cyan)' }}><Store size={40} /></div>
               <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontFamily: 'Space Grotesk', fontWeight: 800 }}>Seralar / Chest Shop</h3>
               <p style={{ color: '#aaa', lineHeight: 1.6 }}>O'z shaxsiy do'koningizni (Chest Shop) yarating, savdo qiling va biznes imperiyangizni quring.</p>
            </div>
            
            <div className="glass hover-glow" style={{ padding: '3rem 2rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ padding: '15px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '15px', marginBottom: '1.5rem', color: '#ffaa00' }}><Gem size={40} /></div>
               <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontFamily: 'Space Grotesk', fontWeight: 800 }}>Tokenlar Tizimi</h3>
               <p style={{ color: '#aaa', lineHeight: 1.6 }}>O'yindagi maxsus eventlar orqali topiladigan TOKEN lar yordamida noyob imtiyozlarni qo'lga kiriting.</p>
            </div>
            
            <div className="glass hover-glow" style={{ padding: '3rem 2rem', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ padding: '15px', background: 'rgba(255, 51, 51, 0.1)', borderRadius: '15px', marginBottom: '1.5rem', color: '#ff3333' }}><Wallet size={40} /></div>
               <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontFamily: 'Space Grotesk', fontWeight: 800 }}>Pul & Iqtisodiyot</h3>
               <p style={{ color: '#aaa', lineHeight: 1.6 }}>Mukammal /money balansi. Ish toping, moblarni o'ldiring va serverdagi eng boy o'yinchiga aylaning.</p>
            </div>
         </div>
      </section>

      <Comments />
    </div>
  );
};

// --- PAYMENT MODAL ---
const PaymentModal = ({ item, onClose, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (cardNumber.length < 19 || expiry.length < 5) return alert('Karta ma\'lumotlari xato!');
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(item);
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
      <div className="glass animate-float" style={{ padding: '3rem', borderRadius: '30px', width: '450px', position: 'relative', border: '1px solid var(--neon-cyan)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'red', border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}>&times;</button>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Wallet size={50} style={{ color: 'var(--neon-green)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', fontWeight: 900, color: 'var(--neon-green)' }}>TO'LOV QILISH</h2>
          <p style={{ color: '#ccc', marginTop: '10px' }}>To'lovni amalga oshirish: <strong style={{color: '#fff'}}>{item.name}</strong></p>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '10px', color: '#fff' }}>{item.price}</div>
        </div>

        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>KARTA RAQAMI</label>
            <input 
              required
              className="admin-input" 
              placeholder="0000 0000 0000 0000" 
              value={cardNumber} 
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>AMAL QILISH</label>
              <input 
                required
                className="admin-input" 
                placeholder="MM/YY" 
                value={expiry} 
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '');
                  if(v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
                  setExpiry(v);
                }}
                maxLength={5}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>CVC (Ixtiyoriy)</label>
              <input 
                className="admin-input" 
                type="password"
                placeholder="***" 
                value={cvc} 
                onChange={e => setCvc(e.target.value.replace(/\D/g, ''))}
                maxLength={3}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="btn btn-neon" 
            style={{ width: '100%', marginTop: '1rem', padding: '15px' }}
          >
            {isProcessing ? 'TO\'LOV QILINMOQDA...' : 'TO\'LASH VA OLISH'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STORE ---
const StorePage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [paymentItem, setPaymentItem] = useState(null);

  useEffect(() => {
    supabase.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => setItems(data || []));
  }, []);

  const handleBuyClick = (itemName, price) => {
    if(!user) {
      alert("Iltimos, avval PLAYER LOGIN orqali tizimga kiring!");
      return;
    }
    setPaymentItem({ name: itemName, price });
  };

  const processPaymentSuccess = async (item) => {
    setPaymentItem(null);
    const res = await supabase.from('orders').insert([{ player_name: user.name, item_name: item.name, price: item.price, status: 'Kutilmoqda' }]);
    if(res.error) alert("Xatolik: " + res.error.message);
    else alert("To'lov muvaffaqiyatli! Buyurtmangiz adminga yuborildi.");
  };

  return (
    <div style={{ padding: '8rem 2rem' }}>
       {paymentItem && <PaymentModal item={paymentItem} onClose={() => setPaymentItem(null)} onSuccess={processPaymentSuccess} />}
       <h1 style={{ fontSize: '5rem', textAlign: 'center', marginBottom: '6rem' }}><span className="text-gradient">SERVER SHOP</span></h1>
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', maxWidth: '1300px', margin: '0 auto' }}>
          {items.map(i => (
            <div key={i.id} className="glass animate-float" style={{ padding: '4rem 3rem', borderRadius: '30px', textAlign: 'center' }}>
               <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>{i.icon}</div>
               <h2 style={{ fontSize: '2.5rem' }}>{i.name}</h2>
               <p style={{ color: '#888', margin: '2rem 0', fontSize: '1.1rem' }}>{i.description}</p>
               <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '3rem', color: 'var(--neon-green)' }}>{i.price}</div>
               <button onClick={() => handleBuyClick(i.name, i.price)} className="btn btn-neon" style={{ width: '100%', fontSize: '1.2rem' }}>PURCHASE</button>
            </div>
          ))}
       </div>
    </div>
  );
};

// --- KITS & RANKS PAGE ---
const InventoryModal = ({ rank, onClose }) => {
  if (!rank) return null;
  
  // Generating a fake inventory layout based on rank
  const slots = Array(27).fill(null);
  
  // Customizing items based on rank level
  const items = [
    { pos: 10, icon: <Swords strokeWidth={1.5} />, color: rank.color, name: `${rank.name} Qilichi` },
    { pos: 11, icon: <Shield strokeWidth={1.5} />, color: rank.color, name: `${rank.name} Sovuti` },
    { pos: 12, icon: <Package strokeWidth={1.5} />, color: rank.color, name: 'Maxsus Buyumlar' },
    { pos: 14, icon: <Gem strokeWidth={1.5} />, color: '#39ff14', name: 'Zabarjad (16x)' },
    { pos: 15, icon: <Award strokeWidth={1.5} />, color: '#ffaa00', name: 'Totem' },
    { pos: 16, icon: <Zap strokeWidth={1.5} />, color: '#00ffff', name: 'Tezlik Ikiri' },
  ];
  
  items.forEach(item => {
    slots[item.pos] = item;
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div className="glass animate-float" style={{ padding: '2rem', borderRadius: '15px', position: 'relative', border: `2px solid ${rank.color}` }}>
         <button onClick={onClose} style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'red', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10 }}>&times;</button>
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
           <div style={{ padding: '10px', background: `${rank.color}22`, borderRadius: '10px', color: rank.color }}>
             {rank.icon}
           </div>
           <div>
             <h3 style={{ fontSize: '1.8rem', color: rank.color, margin: 0, fontFamily: 'Space Grotesk' }}>{rank.name} KITI</h3>
             <p style={{ color: '#aaa', margin: 0 }}>Ushbu narsalar sizga beriladi!</p>
           </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 45px)', gap: '4px', background: '#222', padding: '10px', borderRadius: '8px', border: '2px solid #555' }}>
            {slots.map((slot, index) => (
              <div key={index} style={{ 
                width: '45px', height: '45px', 
                background: '#8b8b8b', 
                border: '2px solid',
                borderTopColor: '#373737', borderLeftColor: '#373737',
                borderBottomColor: '#ffffff', borderRightColor: '#ffffff',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: slot ? 'pointer' : 'default',
                position: 'relative'
              }}>
                 {slot && (
                   <div title={slot.name} style={{ color: slot.color, filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))' }}>
                     {slot.icon}
                   </div>
                 )}
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const KitsPage = () => {
  const { user } = useAuth();
  const [selectedRank, setSelectedRank] = useState(null);
  const [paymentItem, setPaymentItem] = useState(null);

  const handleRankBuyClick = (itemName, price) => {
    if(!user) {
      alert("Sotib olish uchun avval PLAYER LOGIN qiling!");
      return;
    }
    if(price === 'BEPUL') {
      if(window.confirm(`Haqiqatan ham ${itemName} ni olmoqchimisiz?`)) {
        supabase.from('orders').insert([{ player_name: user.name, item_name: itemName, price, status: 'Kutilmoqda' }]).then(res => {
          if(res.error) alert("Baza ulanmagan: " + res.error.message);
          else alert("Adminga xabar ketdi! Admin panelni tekshiring.");
        });
      }
    } else {
      setPaymentItem({ name: itemName, price });
    }
  };

  const processRankPaymentSuccess = async (item) => {
    setPaymentItem(null);
    const res = await supabase.from('orders').insert([{ player_name: user.name, item_name: item.name, price: item.price, status: 'Kutilmoqda' }]);
    if(res.error) alert("Baza ulanmagan: " + res.error.message);
    else alert("To'lov muvaffaqiyatli! Admin panelni tekshiring.");
  };

  const ranks = [
    { name: 'PLAYER', price: 'BEPUL', color: '#a0a0a0', icon: <User size={40}/>, desc: "Boshlang'ich o'yinchi kiti va huquqlari." },
    { name: 'VIP', price: '6,000 UZS', color: '#55ff55', icon: <Star size={40}/>, desc: "VIP imtiyozlari, maxsus kit va chat ranglari." },
    { name: 'VIP+', price: '13,000 UZS', color: '#ffaa00', icon: <Award size={40}/>, desc: "VIP dan ko'proq imkoniyatlar va yaxshiroq kit." },
    { name: 'LEGEND', price: '21,000 UZS', color: '#00aaaa', icon: <Shield size={40}/>, desc: "Afsonaviy o'yinchilar uchun maxsus buyumlar." },
    { name: 'DONATOR', price: '28,000 UZS', color: '#e6cc80', icon: <Package size={40}/>, desc: "Server rivojiga yordam berganlar uchun kuchli kit." },
    { name: 'GOLD', price: '35,000 UZS', color: '#ffd700', icon: <Gem size={40}/>, desc: "Oltin rank! Ajoyib imkoniyatlar va qimmatbaho kit." },
    { name: 'NITRO', price: '43,000 UZS', color: '#00ffff', icon: <Zap size={40}/>, desc: "Tezkor rivojlanish uchun Nitro kiti va prefix." },
    { name: 'COMET / YT', price: '56,000 UZS', color: '#aa00aa', icon: <Server size={40}/>, desc: "YouTuberlar va faollar uchun. Comet kit." },
    { name: 'HERO', price: '79,000 UZS', color: '#ff3333', icon: <Swords size={40}/>, desc: "Server qahramonlari uchun kuchli qurollar kiti." },
    { name: 'ULTRA', price: '100,000 UZS', color: '#ffff55', icon: <Zap size={40}/>, desc: "Cheksiz imtiyozlarga yaqinlashuvchi Ultra kit." },
    { name: 'PRIME', price: '200,000 UZS', color: '#ff00ff', icon: <Crown size={40}/>, desc: "ENG ZO'RI! Serverdagi eng kuchli kit va VIP imkoniyatlar (Butunlay / 30 Kun)." }
  ].reverse();

  const shopKits = [
    { name: 'WARRIOR', price: '15,000 COIN', color: '#ff4444', icon: <Swords size={40}/>, desc: "Jang maydonlari uchun xavfli jangchi kiti. Temir/Olmos aralash sovut va kuchli qilich." },
    { name: 'BRUTE', price: '25,000 COIN', color: '#ffaa00', icon: <Shield size={40}/>, desc: "Buzib bo'lmaydigan darajadagi himoya. Judayam qattiq chidamli tank kiti." },
    { name: 'MINER', price: '10,000 COIN', color: '#00ffff', icon: <Gem size={40}/>, desc: "Shaxtyorlar uchun maxsus. Samaradorlik borasida eng zo'r asboblar to'plami." },
    { name: 'ARCHER', price: '18,000 COIN', color: '#55ff55', icon: <Zap size={40}/>, desc: "Uzoqdan zarba berish ustasi. O'tkir kamon o'qlari va tezlik iksiri." },
    { name: 'BUILDER', price: '8,000 COIN', color: '#aaa', icon: <Package size={40}/>, desc: "Ajoyib binolar qurish uchun kerakli asosiy resurs va asboblar kiti." }
  ];

  return (
    <div style={{ padding: '6rem 2rem', paddingBottom: '10rem' }}>
       <InventoryModal rank={selectedRank} onClose={() => setSelectedRank(null)} />
       {paymentItem && <PaymentModal item={paymentItem} onClose={() => setPaymentItem(null)} onSuccess={processRankPaymentSuccess} />}
       
       <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
         <h1 style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'Space Grotesk' }}> SERVER <span className="text-gradient">RANKS & KITS</span></h1>
         <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '1rem' }}>Barcha ranklar va ularning oylik (yoki butunlay) narxlari</p>
       </div>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
          {ranks.map((rank, idx) => (
            <div key={rank.name} className="glass" style={{ padding: '3rem 2rem', borderRadius: '30px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: rank.color, boxShadow: `0 0 20px ${rank.color}` }}></div>
               
               <div style={{ color: rank.color, marginBottom: '1.5rem', filter: `drop-shadow(0 0 10px ${rank.color}88)` }}>
                 {rank.icon}
               </div>

               <h2 style={{ fontSize: '2.5rem', color: rank.color, textShadow: `0 0 15px ${rank.color}55`, marginBottom: '0.5rem', fontFamily: 'Space Grotesk', fontWeight: 900 }}>
                 {rank.name}
               </h2>
               
               <div style={{ fontSize: '2rem', fontWeight: 900, margin: '1rem 0' }}>
                 {rank.price}
               </div>
               
               <p style={{ color: '#aaa', flexGrow: 1, marginBottom: '2rem', lineHeight: 1.6 }}>
                 {rank.desc}
               </p>
               
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button 
                   onClick={() => handleRankBuyClick(rank.name, rank.price)}
                   className="btn" 
                   style={{ flex: 1, background: rank.color, color: '#000', border: 'none', fontWeight: 800 }}>
                   SOTIB OLISH
                 </button>
                 <button 
                   onClick={() => setSelectedRank(rank)}
                   className="btn" 
                   style={{ flex: 1, background: 'transparent', border: `2px solid ${rank.color}`, color: rank.color }}>
                   TARKIBI
                 </button>
               </div>
            </div>
          ))}
       </div>

       <div style={{ textAlign: 'center', marginBottom: '5rem', marginTop: '10rem' }}>
         <h1 style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'Space Grotesk' }}> SHOP <span className="text-gradient">KITS</span></h1>
         <p style={{ color: '#888', fontSize: '1.2rem', marginTop: '1rem' }}>O'yin ichidagi pullar (Coins) hisobiga darhol sotib olinadigan maxsus to'plamlar</p>
       </div>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '3rem', maxWidth: '1400px', margin: '0 auto' }}>
          {shopKits.map((rank, idx) => (
            <div key={rank.name} className="glass hover-glow" style={{ padding: '3rem 2rem', borderRadius: '30px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: rank.color, boxShadow: `0 0 20px ${rank.color}` }}></div>
               
               <div style={{ color: rank.color, marginBottom: '1.5rem', filter: `drop-shadow(0 0 10px ${rank.color}88)` }}>
                 {rank.icon}
               </div>

               <h2 style={{ fontSize: '2.5rem', color: rank.color, textShadow: `0 0 15px ${rank.color}55`, marginBottom: '0.5rem', fontFamily: 'Space Grotesk', fontWeight: 900 }}>
                 {rank.name}
               </h2>
               
               <div style={{ fontSize: '2rem', fontWeight: 900, margin: '1rem 0' }}>
                 {rank.price}
               </div>
               
               <p style={{ color: '#aaa', flexGrow: 1, marginBottom: '2rem', lineHeight: 1.6 }}>
                 {rank.desc}
               </p>
               
               <div style={{ display: 'flex', gap: '10px' }}>
                 <button 
                   onClick={() => handleRankBuyClick(rank.name, rank.price)}
                   className="btn" 
                   style={{ flex: 1, background: rank.color, color: '#000', border: 'none', fontWeight: 800 }}>
                   SOTIB OLISH
                 </button>
                 <button 
                   onClick={() => setSelectedRank(rank)}
                   className="btn" 
                   style={{ flex: 1, background: 'transparent', border: `2px solid ${rank.color}`, color: rank.color }}>
                   TARKIBI
                 </button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="mesh-bg"></div>
      <div className="grid-overlay"></div>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/kits" element={<KitsPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
