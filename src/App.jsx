
import React, { useEffect, useState } from 'react';
import {
  CalendarDays, MapPin, Music2, Heart, Menu, X, Send, Gift,
  LockKeyhole, LogOut, Users, MessageCircle, Clock
} from 'lucide-react';
import { auth, db, firebaseReady } from './firebase';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import {
  addDoc, collection, onSnapshot, query, orderBy, Timestamp
} from 'firebase/firestore';

const MAPS = 'https://maps.app.goo.gl/Z7H8y4ikgx8NjoG4A';
const DANA = '085185052392';
const DAY = 24 * 60 * 60 * 1000;

function fmt(ts) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(ts?.toDate?.() || new Date(ts));
  } catch {
    return '';
  }
}

function App() {
  const [page, setPage] = useState('home');
  const [menu, setMenu] = useState(false);
  const [guest] = useState(
    new URLSearchParams(window.location.search).get('to') || ''
  );
  const [name, setName] = useState('');
  const [count, setCount] = useState('2');
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState('Hadir');
  const [publicMessages, setPublicMessages] = useState([]);
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rsvps, setRsvps] = useState([]);
  const [envelopes, setEnvelopes] = useState([]);
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState('');

  useEffect(() => {
    if (!firebaseReady || !db) return;
    const q = query(
      collection(db, 'publicMessages'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snapshot => {
      setPublicMessages(
        snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.expiresAt?.toMillis?.() > Date.now())
      );
    }, () => {
      setStatus('Ucapan belum dapat dimuat.');
    });
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const unsub1 = onSnapshot(
      query(collection(db, 'rsvps'), orderBy('createdAt', 'desc')),
      s => setRsvps(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(
      query(collection(db, 'envelopes'), orderBy('createdAt', 'desc')),
      s => setEnvelopes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsub3 = onSnapshot(
      query(collection(db, 'guestList'), orderBy('name')),
      s => setGuests(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  async function submitRSVP(e) {
    e.preventDefault();

    if (!firebaseReady || !db) {
      setStatus('Firebase belum dikonfigurasi.');
      return;
    }
    if (!name.trim() || !message.trim()) {
      setStatus('Nama dan ucapan wajib diisi.');
      return;
    }

    try {
      const createdAt = Timestamp.now();
      const expiresAt = Timestamp.fromMillis(Date.now() + DAY);

      await addDoc(collection(db, 'rsvps'), {
        name: name.trim(),
        attendance,
        count: Number(count),
        message: message.trim(),
        guestCode: guest || null,
        createdAt
      });

      await addDoc(collection(db, 'publicMessages'), {
        name: name.trim(),
        message: message.trim(),
        createdAt,
        expiresAt
      });

      setName('');
      setMessage('');
      setStatus('Terima kasih! RSVP berhasil dikirim.');
    } catch (err) {
      setStatus('Gagal mengirim. Periksa konfigurasi Firebase dan Rules.');
    }
  }

  async function login(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus('');
    } catch {
      setStatus('Login gagal. Periksa email dan sandi admin.');
    }
  }

  async function addGuest(e) {
    e.preventDefault();
    if (!newGuest.trim() || !db) return;

    try {
      const code = crypto.randomUUID().slice(0, 8).toUpperCase();
      await addDoc(collection(db, 'guestList'), {
        name: newGuest.trim(),
        code,
        createdAt: Timestamp.now()
      });
      setNewGuest('');
    } catch {
      setStatus('Gagal menambahkan tamu. Periksa akses admin.');
    }
  }

  async function addEnvelope(r) {
    const nominal = prompt('Nominal amplop (angka rupiah):');
    if (!nominal || !/^\d+$/.test(nominal)) return;

    const note = prompt('Catatan (opsional):') || '';

    try {
      await addDoc(collection(db, 'envelopes'), {
        guestName: r.name,
        amount: Number(nominal),
        note,
        createdAt: Timestamp.now(),
        source: 'dicatat admin'
      });
    } catch {
      setStatus('Gagal mencatat amplop.');
    }
  }

  const nav = [
    ['home', 'Beranda'],
    ['detail', 'Detail Acara'],
    ['rsvp', 'RSVP'],
    ['gift', 'Amplop Digital'],
    ['messages', 'Ucapan']
  ];

  return (
    <>
      <header className="top">
        <a className="brand" href="#home" onClick={() => setPage('home')}>
          Rizal <i>&</i> Dina
        </a>
        <button
          className="menubtn"
          onClick={() => setMenu(!menu)}
          aria-label="Buka menu"
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav className={menu ? 'show' : ''}>
          {nav.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setPage(id);
                setMenu(false);
              }}
            >
              {label}
            </button>
          ))}
          <button onClick={() => {
            setPage('admin');
            setMenu(false);
          }}>
            Admin
          </button>
        </nav>
      </header>

      {page === 'home' && (
        <main className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">THE WEDDING OF</p>
            <h1>Fahrizal <em>&</em><br />Dina Silma Aliya</h1>
            <p className="nickname">Rizal & Dina</p>
            <div className="ornament">✦ ───── ❦ ───── ✦</div>
            <p className="date">20 · 11 · 2030</p>
            <p className="intro">
              Dengan penuh rasa syukur, kami mengundang Anda untuk menjadi
              bagian dari hari bahagia kami.
            </p>
            {guest && <p className="guesttag">Kepada Yth. {guest}</p>}
            <button className="primary" onClick={() => setPage('detail')}>
              Buka Undangan <span>↗</span>
            </button>
            <p className="scrollhint">
              DENGAN CINTA, KAMI MENANTI KEHADIRAN ANDA
            </p>
          </div>
        </main>
      )}

      {page === 'detail' && (
        <section className="section detail">
          <p className="eyebrow">SAVE THE DATE</p>
          <h2>Hari Bahagia Kami</h2>
          <p className="muted">
            Merupakan kehormatan bagi kami apabila Anda berkenan hadir
            dan memberikan doa restu.
          </p>
          <div className="detailgrid">
            <article className="paper">
              <CalendarDays />
              <h3>Akad & Resepsi</h3>
              <p>Rabu, 20 November 2030</p>
              <p>Waktu acara akan diperbarui</p>
              <small>Nama orang tua</small>
              <p>Ayah & Ibu Fahrizal<br />Ayah & Ibu Dina Silma Aliya</p>
              <span className="custom">
                Silakan ganti nama orang tua sebelum publikasi.
              </span>
            </article>
            <article className="paper">
              <MapPin />
              <h3>Lokasi Acara</h3>
              <p>Alamat mengikuti titik lokasi yang dibagikan</p>
              <a className="primary linkbtn" href={MAPS} target="_blank" rel="noreferrer">
                Buka Google Maps ↗
              </a>
            </article>
          </div>
          <p className="quote">
            “Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan
            untukmu pasangan hidup...”
          </p>
        </section>
      )}

      {page === 'rsvp' && (
        <section className="section">
          <p className="eyebrow">KONFIRMASI KEHADIRAN</p>
          <h2>RSVP & Ucapan</h2>
          <p className="muted">Tinggalkan konfirmasi dan doa terbaik untuk Rizal & Dina.</p>
          <form className="form paper" onSubmit={submitRSVP}>
            <label>Nama lengkap
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nama Anda" />
            </label>
            <label>Konfirmasi kehadiran
              <select value={attendance} onChange={e => setAttendance(e.target.value)}>
                <option>Hadir</option>
                <option>Belum pasti</option>
                <option>Tidak hadir</option>
              </select>
            </label>
            <label>Jumlah tamu
              <select value={count} onChange={e => setCount(e.target.value)}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} orang</option>)}
              </select>
            </label>
            <label>Ucapan & doa
              <textarea required maxLength="500" value={message} onChange={e => setMessage(e.target.value)} placeholder="Tuliskan doa terbaik Anda..." rows="4" />
            </label>
            <button className="primary full" type="submit"><Send size={16} /> Kirim RSVP</button>
            {status && <p className="status">{status}</p>}
          </form>
          <p className="privacy"><Clock size={14} /> Ucapan publik disembunyikan setelah 24 jam. Data RSVP hanya untuk admin.</p>
        </section>
      )}

      {page === 'messages' && (
        <section className="section">
          <p className="eyebrow">DOA & HARAPAN</p>
          <h2>Ucapan Untuk Pengantin</h2>
          <p className="muted">Ucapan akan tampil selama 24 jam sejak dikirim.</p>
          <div className="messages">
            {publicMessages.length ? publicMessages.map(m => (
              <article className="message paper" key={m.id}>
                <Heart size={17} />
                <p>{m.message}</p>
                <strong>{m.name}</strong>
                <small>{fmt(m.createdAt)}</small>
              </article>
            )) : <p className="empty">Belum ada ucapan baru. Jadilah yang pertama mengirim doa.</p>}
          </div>
        </section>
      )}

      {page === 'gift' && (
        <section className="section">
          <p className="eyebrow">TANDA KASIH</p>
          <h2>Amplop Digital</h2>
          <p className="muted">
            Doa dan kehadiran Anda adalah hadiah terindah. Jika ingin berbagi
            tanda kasih, berikut informasi rekening kami.
          </p>
          <div className="giftgrid">
            <article className="paper giftcard">
              <div className="bank dana">DANA</div>
              <h3>{DANA}</h3>
              <p>a.n. Fahrizal & Dina</p>
              <button className="outline" onClick={() => navigator.clipboard?.writeText(DANA)}>Salin Nomor</button>
            </article>
            <article className="paper giftcard">
              <div className="bank bri">▥ BRI</div>
              <h3>{DANA}</h3>
              <p>a.n. Fahrizal & Dina</p>
              <small>Pastikan nomor ini benar-benar rekening BRI sebelum dipublikasikan.</small>
              <button className="outline" onClick={() => navigator.clipboard?.writeText(DANA)}>Salin Nomor</button>
            </article>
          </div>
          <p className="privacy">Riwayat amplop hanya tersedia untuk admin.</p>
        </section>
      )}

      {page === 'admin' && (
        <section className="adminpage">
          <div className="adminhead">
            <p className="eyebrow">PRIVATE AREA</p>
            <h2>Dashboard Admin</h2>
            <p className="muted">Akses harus dilindungi Firebase Security Rules.</p>
          </div>

          {!firebaseReady ? (
            <div className="paper adminbox">
              <h3>Firebase belum dikonfigurasi</h3>
              <p>Periksa konfigurasi Firebase sebelum menggunakan dashboard.</p>
            </div>
          ) : !user ? (
            <form className="paper form adminbox" onSubmit={login}>
              <LockKeyhole />
              <h3>Login Admin</h3>
              <label>Email admin
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label>Sandi
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              <button className="primary full">Masuk</button>
              {status && <p className="status">{status}</p>}
            </form>
          ) : (
            <>
              <div className="adminbar">
                <span>Login: {user.email}</span>
                <button className="outline" onClick={() => signOut(auth)}><LogOut size={15} /> Keluar</button>
              </div>
              <div className="stats">
                <div className="paper"><Users /><strong>{guests.length}</strong><span>Daftar tamu</span></div>
                <div className="paper"><MessageCircle /><strong>{rsvps.length}</strong><span>RSVP tersimpan</span></div>
                <div className="paper"><Gift /><strong>{envelopes.length}</strong><span>Catatan amplop</span></div>
              </div>
              <div className="paper adminbox">
                <h3>Daftar Tamu & Link Undangan</h3>
                <form className="inlineform" onSubmit={addGuest}>
                  <input value={newGuest} onChange={e => setNewGuest(e.target.value)} placeholder="Nama tamu baru" />
                  <button className="primary">Tambah</button>
                </form>
                {guests.map(g => (
                  <div className="adminrow" key={g.id}>
                    <span>{g.name}<small>Kode: {g.code}</small></span>
                    <button className="outline" onClick={() => {
                      navigator.clipboard?.writeText(location.origin + '/?to=' + encodeURIComponent(g.name));
                      alert('Link undangan disalin.');
                    }}>Salin link</button>
                  </div>
                ))}
              </div>
              <div className="paper adminbox">
                <h3>Pesan RSVP (privat)</h3>
                {rsvps.map(r => (
                  <div className="adminrow" key={r.id}>
                    <span><b>{r.name}</b><small>{r.attendance} · {r.count} orang · {fmt(r.createdAt)}<br />{r.message}</small></span>
                    <button className="outline" onClick={() => addEnvelope(r)}>Catat amplop</button>
                  </div>
                ))}
              </div>
              <div className="paper adminbox">
                <h3>Riwayat Amplop (privat)</h3>
                {envelopes.map(a => (
                  <div className="adminrow" key={a.id}>
                    <span>{a.guestName}<small>{a.note || '—'} · {fmt(a.createdAt)}</small></span>
                    <b>Rp {Number(a.amount).toLocaleString('id-ID')}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <footer>
        <div className="footerbrand">R <i>&</i> D</div>
        <p>Fahrizal & Dina Silma Aliya</p>
        <small>20 November 2030 · Dibuat dengan cinta</small>
        <div className="footerlinks">
          <button onClick={() => setPage('rsvp')}>RSVP</button>
          <button onClick={() => setPage('admin')}>Admin</button>
          <a href={MAPS} target="_blank" rel="noreferrer">Lokasi</a>
        </div>
      </footer>

      <button className="music" title="Musik" onClick={() => setStatus('Fitur musik belum terhubung. Tambahkan file audio berlisensi sendiri untuk mengaktifkannya.')}>
        <Music2 size={18} /> Musik
      </button>
    </>
  );
}

export default App;
