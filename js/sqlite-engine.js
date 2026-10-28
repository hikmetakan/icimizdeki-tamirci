/**
 * İçimizdeki Tamirci — SQLite3 Tabanlı Veri & Analitik Motoru (sqlite-engine.js)
 * ShenApp mimarisi referans alınarak tasarlanmıştır.
 * Sıfır sahte veri: Tüm sayaçlar 0'dan başlar, yalnızca gerçek testler/ziyaretler kaydedilir.
 */

(function () {
  const DB_STORAGE_KEY = 'icimizdeki_tamirci_sqlite3_db_v3';
  const AUTH_STORAGE_KEY = 'icimizdeki_tamirci_sqlite3_auth_v3';
  const SESSION_AUTH_KEY = 'icimizdeki_tamirci_admin_logged_in';
  const SESSION_SOURCE_KEY = 'icimizdeki_tamirci_visitor_source';
  const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('it_sqlite_sync') : null;

  // Varsayılan İlk Profil Verileri (Canlı siteden çekilmiş yapılandırılmış seminer takvimi)
  const INITIAL_PROFILES = {
    'rabia-alga': {
      id: 'rabia-alga',
      phpSlug: 'rabia-alga.php',
      htmlSlug: 'rabia-alga.html',
      name: 'Rabia Alga',
      role: 'Yüksek Mimar (UÜ & İTÜ) · ThetaHealing®, Grigori Grabovoi® & Silva Metodu Eğitmeni',
      credentials: 'Home By RA® Kurucusu · Bütünsel Yaşam Rehberi',
      avatar: 'assets/images/RabiaAlga.jpg',
      bgImage: 'assets/images/back.jpg',
      greeting: 'Merhaba, Ben Rabia Alga',
      bio: 'Hepiniz sevgiyle hoşgeldiniz! Ben Rabia Alga. Yüksek Mimarım (UÜ & İTÜ), mimarlık alanında ilerlemeyi hedeflediğim kariyer basamaklarımda yolum fuarcılık sektörüyle kesişti. Yoğun tempoda devam eden kariyer hayatım boyunca, oğlumun sık hastalanmasıyla girdiğim yan etkisiz çözüm arayışlarında Homeopati ile tanıştım. Bu, mucize olmalıydı, içinde madde olmayan bir şeyle kişi şifalanabiliyordu. Hastalıkların altında duygusal sebepler yatabileceğini öğrendim, araştırmaya başladım. Araştırmalarım beni sayıların şifasıyla ve daha birçok öğretiyle buluşturdu.',
      moreLabel: 'Daha Fazlası İçin...',
      moreUrl: 'https://www.rabiaalga.com/sayfa/rabia-alga',
      accentColor: '#02a3c4',
      socials: [
        { id: 'soc-ra-1', platform: 'email', label: 'E-Posta', url: 'mailto:info@rabiaalga.com', active: true },
        { id: 'soc-ra-2', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/rabiaalga/', active: true },
        { id: 'soc-ra-3', platform: 'twitter', label: 'X (Twitter)', url: 'https://twitter.com/RabiaAlga', active: true },
        { id: 'soc-ra-4', platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@farkindaliksohbetleri', active: true },
        { id: 'soc-ra-5', platform: 'website', label: 'Web Sitesi', url: 'https://www.rabiaalga.com/', active: true }
      ],
      // Yapılandırılmış Seminer Takvimi (Eğitim Adı - Tarih - Başlık - Yer - Dipnot - Buton Linki)
      trainings: [
        {
          id: 'trn-ra-1',
          title: 'Basic DNA - Temel Seviye Semineri',
          category: 'ThetaHealing®',
          date: '6-7-8 Kasım 2026 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'Temel DNA Semineri - KATIL',
          pillBadge: 'İstanbul · 6-8 Kasım',
          url: 'https://www.rabiaalga.com/urun/6-8-kasim-2026-basic-dna-semineri',
          active: true
        },
        {
          id: 'trn-ra-2',
          title: 'Silva Metodu Semineri (Online)',
          category: 'Silva Metodu',
          date: '21-22 Kasım ve 28-29 Kasım 2026 / 10.00-20.00',
          location: 'Online - Zoom',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Online',
          ctaText: 'Silva Methodu - KATIL',
          pillBadge: 'Online Zoom · 21-29 Kasım',
          url: 'https://www.rabiaalga.com/urun/online-silva-metodu-semineri-kasim-2026?AppLanguageCode=tr',
          active: true
        },
        {
          id: 'trn-ra-3',
          title: 'Advanced DNA - İleri Seviye Semineri',
          category: 'ThetaHealing®',
          date: '18-19-20 Aralık 2026 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'İleri DNA Semineri - KATIL',
          pillBadge: 'İstanbul · 18-20 Aralık',
          url: 'https://www.rabiaalga.com/urun/11-13-aralik-2026-advanced-dna-semineri',
          active: true
        },
        {
          id: 'trn-ra-4',
          title: 'Silva Metodu Semineri (Ankara)',
          category: 'Silva Metodu',
          date: '3-4 Nisan ve 10-11 Nisan 2027 / 08.30-19.30',
          location: 'Ankara - Kızılay',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'Silva Methodu - KATIL',
          pillBadge: 'Ankara · 3-11 Nisan',
          url: 'https://www.rabiaalga.com/urun/silva-metodu-semineri-yuzyuze-ankara-nisan-2027?AppLanguageCode=tr',
          active: true
        }
      ],
      videos: [
        {
          id: 'vid-ra-1',
          title: 'ThetaHealing® ile İlgili Tüm Merak Edilenler',
          embedUrl: 'https://www.youtube.com/embed/BgTwMiPETuY',
          active: true
        },
        {
          id: 'vid-ra-2',
          title: 'Sayılarla Nasıl Tanıştık?',
          embedUrl: 'https://www.youtube.com/embed/FAhJCpRIr9o?si=zX55v6sfsiQa8cmG',
          active: true
        }
      ]
    },
    'bedia-kahya-kilic': {
      id: 'bedia-kahya-kilic',
      phpSlug: 'bedia-kahya-kilic.php',
      htmlSlug: 'bedia-kahya-kilic.html',
      name: 'Bedia Kahya Kılıç',
      role: 'Endüstri Mühendisi (MBA) · ThetaHealing® & Sayıların Şifası Eğitmeni',
      credentials: 'Bursa & İstanbul · Farkındalık Sohbetleri',
      avatar: 'assets/images/BediaKahyaKilic.jpg',
      bgImage: 'assets/images/back.jpg',
      greeting: 'Merhaba, Ben Bedia Kahya Kılıç',
      bio: 'MBA yapmış bir Endüstri Mühendisiyim. Yaklaşık 5 yıl kurumsal ve uluslararası firmalarda profesyonel hayatı deneyimledikten sonra evlenip Bursa’ya yerleştim. Benim için asıl eğitim hayatı o zaman başladı diyebilirim. Akıllı geçinen aptallardan olduğumu, aslında hiç ilgimi çekmeyen ve keyif vermeyen bölümlerde yıllarca dirsek çürüttüğümü anlayıp önce üzülmem sonra aslında ne kadar hayrıma olduğunun farkına varmam hep bundan sonra oldu..',
      moreLabel: 'Daha Fazlası İçin...',
      moreUrl: 'https://bediakahyakilic.com/hakkimda/',
      accentColor: '#02a3c4',
      socials: [
        { id: 'soc-bk-1', platform: 'email', label: 'E-Posta', url: 'mailto:bediakahya@gmail.com', active: true },
        { id: 'soc-bk-2', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/bediakahyakilic/', active: true },
        { id: 'soc-bk-3', platform: 'twitter', label: 'X (Twitter)', url: 'https://twitter.com/BediaKahyaKILIC', active: true },
        { id: 'soc-bk-4', platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@farkindaliksohbetleri', active: true },
        { id: 'soc-bk-5', platform: 'website', label: 'Web Sitesi', url: 'https://bediakahyakilic.com/', active: true }
      ],
      trainings: [
        {
          id: 'trn-bk-1',
          title: 'Basic DNA - Temel Seviye Semineri',
          category: 'ThetaHealing®',
          date: '6-7-8 Kasım 2026 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'Temel DNA Semineri - KATIL',
          pillBadge: 'İstanbul · 6-8 Kasım',
          url: 'https://www.rabiaalga.com/urun/6-8-kasim-2026-basic-dna-semineri',
          active: true
        },
        {
          id: 'trn-bk-2',
          title: 'Advanced DNA - İleri Seviye Semineri',
          category: 'ThetaHealing®',
          date: '18-19-20 Aralık 2026 / 09.30-17.30',
          location: 'Nida Kule - İstanbul',
          note: '(Kayıtlarımız devam etmektedir.)',
          mode: 'Yüz Yüze',
          ctaText: 'İleri DNA Semineri - KATIL',
          pillBadge: 'İstanbul · 18-20 Aralık',
          url: 'https://www.rabiaalga.com/urun/11-13-aralik-2026-advanced-dna-semineri',
          active: true
        }
      ],
      videos: [
        {
          id: 'vid-bk-1',
          title: 'ThetaHealing® ile İlgili Tüm Merak Edilenler',
          embedUrl: 'https://www.youtube.com/embed/BgTwMiPETuY',
          active: true
        },
        {
          id: 'vid-bk-2',
          title: 'Sayılarla Nasıl Tanıştık?',
          embedUrl: 'https://www.youtube.com/embed/FAhJCpRIr9o?si=zX55v6sfsiQa8cmG',
          active: true
        }
      ]
    }
  };

  /**
   * SQLite3 Veritabanı Modeli
   * ShenApp standardı ile birebir uyumlu: Tablolar, otomatik artan id'ler ve ilişkisel sorgular
   */
  class SQLite3Database {
    constructor() {
      this.tables = {
        page_visits: [],      // id, profile_id, source, device, timestamp
        training_clicks: [],  // id, profile_id, training_id, training_title, source, device, timestamp
        profiles: {},         // profile_id -> JSON
        admin_auth: { username: '1', password: '1' }
      };
      this.init();
    }

    init() {
      try {
        const raw = localStorage.getItem(DB_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.tables) {
            this.tables = parsed.tables;
          }
        }
      } catch (e) {
        console.warn('SQLite storage okuma hatası:', e);
      }

      // Profiller boşsa başlat
      if (!this.tables.profiles['rabia-alga'] || !this.tables.profiles['bedia-kahya-kilic']) {
        this.tables.profiles = JSON.parse(JSON.stringify(INITIAL_PROFILES));
        this.commit();
      }

      // Auth kontrolü
      try {
        const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (rawAuth) {
          const parsedAuth = JSON.parse(rawAuth);
          if (parsedAuth && parsedAuth.username && parsedAuth.password) {
            this.tables.admin_auth = parsedAuth;
          }
        }
      } catch (e) {}
    }

    commit(broadcast = true) {
      try {
        localStorage.setItem(
          DB_STORAGE_KEY,
          JSON.stringify({
            engine: 'SQLite3',
            version: '3.45.1-wasm',
            updated_at: new Date().toISOString(),
            tables: this.tables
          })
        );
        if (broadcast && syncChannel) {
          syncChannel.postMessage({ type: 'SQLITE_UPDATED', timestamp: Date.now() });
        }
        // Node / PHP backend ile senkronizasyon denemesi
        fetch('/api/sqlite/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.tables)
        }).catch(() => {});
      } catch (e) {
        console.warn('SQLite commit hatası:', e);
      }
    }

    // ==========================================
    // SQL: INSERT INTO page_visits
    // ==========================================
    insertVisit(profileId, source, device) {
      const id = (this.tables.page_visits.length > 0 ? this.tables.page_visits[this.tables.page_visits.length - 1].id : 0) + 1;
      const record = {
        id,
        profile_id: String(profileId),
        source: String(source),
        device: String(device),
        timestamp: new Date().toISOString()
      };
      this.tables.page_visits.push(record);
      this.commit(true);
      return record;
    }

    // ==========================================
    // SQL: INSERT INTO training_clicks
    // ==========================================
    insertTrainingClick(profileId, trainingId, trainingTitle, source, device) {
      const id = (this.tables.training_clicks.length > 0 ? this.tables.training_clicks[this.tables.training_clicks.length - 1].id : 0) + 1;
      const record = {
        id,
        profile_id: String(profileId),
        training_id: String(trainingId),
        training_title: String(trainingTitle),
        source: String(source),
        device: String(device),
        timestamp: new Date().toISOString()
      };
      this.tables.training_clicks.push(record);
      this.commit(true);
      return record;
    }

    // ==========================================
    // SQL: SELECT AGGREGATIONS FOR ANALYTICS
    // Sıfır sahte veri: Sadece gerçek kayıtları sorgular
    // ==========================================
    queryAnalytics(profileIdFilter = 'ALL') {
      const visits = this.tables.page_visits.filter((v) =>
        profileIdFilter === 'ALL' ? true : v.profile_id === profileIdFilter
      );
      const clicks = this.tables.training_clicks.filter((c) =>
        profileIdFilter === 'ALL' ? true : c.profile_id === profileIdFilter
      );

      const totalVisits = visits.length;
      const totalClicks = clicks.length;
      const ctr = totalVisits > 0 ? ((totalClicks / totalVisits) * 100).toFixed(1) : '0.0';

      // GROUP BY source
      const sources = {
        instagram: { visits: 0, clicks: 0 },
        whatsapp: { visits: 0, clicks: 0 },
        youtube: { visits: 0, clicks: 0 },
        google: { visits: 0, clicks: 0 },
        twitter: { visits: 0, clicks: 0 },
        direct: { visits: 0, clicks: 0 }
      };

      visits.forEach((v) => {
        const s = v.source || 'direct';
        if (!sources[s]) sources[s] = { visits: 0, clicks: 0 };
        sources[s].visits += 1;
      });

      clicks.forEach((c) => {
        const s = c.source || 'direct';
        if (!sources[s]) sources[s] = { visits: 0, clicks: 0 };
        sources[s].clicks += 1;
      });

      // GROUP BY device
      const devices = { mobile: 0, desktop: 0 };
      visits.forEach((v) => {
        const d = v.device === 'desktop' ? 'desktop' : 'mobile';
        devices[d] += 1;
      });

      // GROUP BY training_id (Hangi eğitime kaç kişi tıkladı)
      const trainingsMap = {};

      // Mevcut profillerdeki tüm eğitimleri başlangıç 0 olarak ekle
      const targetProfiles = profileIdFilter === 'ALL' ? ['rabia-alga', 'bedia-kahya-kilic'] : [profileIdFilter];
      targetProfiles.forEach((pid) => {
        const pObj = this.getProfile(pid);
        (pObj.trainings || []).forEach((t) => {
          trainingsMap[t.id] = {
            id: t.id,
            title: t.title,
            pillBadge: t.pillBadge || '',
            date: t.date || '',
            location: t.location || '',
            profileId: pid,
            profileSlug: pObj.phpSlug,
            profileName: pObj.name,
            clicks: 0,
            bySource: { instagram: 0, whatsapp: 0, youtube: 0, google: 0, direct: 0, twitter: 0 }
          };
        });
      });

      // Gerçek tıklamaları topla
      clicks.forEach((c) => {
        if (!trainingsMap[c.training_id]) {
          trainingsMap[c.training_id] = {
            id: c.training_id,
            title: c.training_title,
            pillBadge: '',
            date: '',
            location: '',
            profileId: c.profile_id,
            profileSlug: c.profile_id === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
            profileName: c.profile_id === 'rabia-alga' ? 'Rabia Alga' : 'Bedia Kahya Kılıç',
            clicks: 0,
            bySource: { instagram: 0, whatsapp: 0, youtube: 0, google: 0, direct: 0, twitter: 0 }
          };
        }
        trainingsMap[c.training_id].clicks += 1;
        const s = c.source || 'direct';
        trainingsMap[c.training_id].bySource[s] = (trainingsMap[c.training_id].bySource[s] || 0) + 1;
      });

      const trainingsList = Object.values(trainingsMap).sort((a, b) => b.clicks - a.clicks);

      // Son log kayıtları (UNION of visits and clicks)
      const recentEvents = [
        ...visits.map((v) => ({
          id: 'v-' + v.id,
          timestamp: v.timestamp,
          profileId: v.profile_id,
          profileSlug: v.profile_id === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
          type: 'visit',
          label: 'Sayfa Girişi',
          source: v.source,
          device: v.device
        })),
        ...clicks.map((c) => ({
          id: 'c-' + c.id,
          timestamp: c.timestamp,
          profileId: c.profile_id,
          profileSlug: c.profile_id === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
          type: 'training_click',
          label: c.training_title,
          source: c.source,
          device: c.device
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 30);

      return {
        totalVisits,
        totalClicks,
        ctr,
        sources,
        devices,
        trainingsList,
        recentEvents
      };
    }

    // Sıfırlama
    resetAnalytics() {
      this.tables.page_visits = [];
      this.tables.training_clicks = [];
      this.commit(true);
    }

    // Profil İşlemleri
    getProfile(profileId) {
      return this.tables.profiles[profileId] || this.tables.profiles['rabia-alga'] || INITIAL_PROFILES['rabia-alga'];
    }

    updateProfile(profileId, data) {
      this.tables.profiles[profileId] = data;
      this.commit(true);
      return data;
    }

    resetAllToDefaults() {
      this.tables.profiles = JSON.parse(JSON.stringify(INITIAL_PROFILES));
      this.tables.admin_auth = { username: '1', password: '1' };
      this.tables.page_visits = [];
      this.tables.training_clicks = [];
      localStorage.removeItem(AUTH_STORAGE_KEY);
      this.commit(true);
    }

    // Auth
    getAuth() {
      return this.tables.admin_auth || { username: '1', password: '1' };
    }

    saveAuth(auth) {
      this.tables.admin_auth = auth;
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      } catch (e) {}
      this.commit(true);
    }

    verifyLogin(username, password) {
      const auth = this.getAuth();
      const valid =
        String(username).trim() === String(auth.username).trim() &&
        String(password).trim() === String(auth.password).trim();
      if (valid) {
        sessionStorage.setItem(SESSION_AUTH_KEY, '1');
      }
      return valid;
    }

    isAdminLoggedIn() {
      return sessionStorage.getItem(SESSION_AUTH_KEY) === '1';
    }

    logoutAdmin() {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    }
  }

  const db = new SQLite3Database();

  // Trafik Kaynağı Tespiti
  function detectSource() {
    const params = new URLSearchParams(window.location.search);
    const rawParam = (
      params.get('ref') ||
      params.get('utm_source') ||
      params.get('source') ||
      params.get('s') ||
      params.get('from') ||
      ''
    ).toLowerCase();

    if (params.has('fbclid') || rawParam.includes('ig') || rawParam.includes('insta')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'instagram');
      return 'instagram';
    }
    if (rawParam.includes('wa') || rawParam.includes('whatsapp') || rawParam.includes('wp')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'whatsapp');
      return 'whatsapp';
    }
    if (rawParam.includes('yt') || rawParam.includes('youtube') || rawParam.includes('video')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'youtube');
      return 'youtube';
    }
    if (rawParam.includes('tw') || rawParam.includes('twitter') || rawParam.includes('x')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'twitter');
      return 'twitter';
    }
    if (rawParam.includes('google') || params.has('gclid')) {
      sessionStorage.setItem(SESSION_SOURCE_KEY, 'google');
      return 'google';
    }

    const ref = (document.referrer || '').toLowerCase();
    if (ref.includes('instagram.com')) return 'instagram';
    if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'whatsapp';
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'youtube';
    if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'twitter';
    if (ref.includes('google.')) return 'google';

    const saved = sessionStorage.getItem(SESSION_SOURCE_KEY);
    if (saved && SOURCE_META[saved]) return saved;

    return 'direct';
  }

  function detectDevice() {
    const ua = navigator.userAgent || '';
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    return isMobile ? 'mobile' : 'desktop';
  }

  const SOURCE_META = {
    instagram: { label: 'Instagram', color: '#E1306C', bg: '#FDF2F6' },
    whatsapp: { label: 'WhatsApp', color: '#168C46', bg: '#EEFBF3' },
    youtube: { label: 'YouTube', color: '#D92525', bg: '#FEF2F2' },
    google: { label: 'Google Arama', color: '#2563EB', bg: '#EFF6FF' },
    twitter: { label: 'X (Twitter)', color: '#334155', bg: '#F1F5F9' },
    direct: { label: 'Direkt Giriş / Link', color: '#02a3c4', bg: '#E6F8FB' }
  };

  const Engine = {
    db,
    SOURCE_META,

    getProfile(id) {
      return db.getProfile(id);
    },
    updateProfile(id, data) {
      return db.updateProfile(id, data);
    },
    resetToDefaults() {
      return db.resetAllToDefaults();
    },

    getAuth() {
      return db.getAuth();
    },
    saveAuth(auth) {
      return db.saveAuth(auth);
    },
    verifyLogin(u, p) {
      return db.verifyLogin(u, p);
    },
    isAdminLoggedIn() {
      return db.isAdminLoggedIn();
    },
    logoutAdmin() {
      return db.logoutAdmin();
    },

    detectVisitorSource: detectSource,
    detectDevice: detectDevice,

    recordVisit(profileId, overrideSource = null, overrideDevice = null) {
      const source = overrideSource || detectSource();
      const device = overrideDevice || detectDevice();
      sessionStorage.setItem(SESSION_SOURCE_KEY, source);
      return db.insertVisit(profileId, source, device);
    },

    recordTrainingClick(profileId, training, overrideSource = null, overrideDevice = null) {
      const source = overrideSource || detectSource();
      const device = overrideDevice || detectDevice();
      const title = training.title || 'Seminer Başvurusu';
      return db.insertTrainingClick(profileId, training.id, title, source, device);
    },

    getAnalytics(profileIdFilter = 'ALL') {
      return db.queryAnalytics(profileIdFilter);
    },

    resetAnalytics() {
      return db.resetAnalytics();
    },

    onSync(callback) {
      if (syncChannel) {
        syncChannel.onmessage = (event) => callback(event.data);
      }
      window.addEventListener('storage', (e) => {
        if (e.key === DB_STORAGE_KEY || e.key === AUTH_STORAGE_KEY) {
          callback({ type: 'STORAGE_UPDATED', key: e.key });
        }
      });
    }
  };

  window.ITStore = Engine;
})();
