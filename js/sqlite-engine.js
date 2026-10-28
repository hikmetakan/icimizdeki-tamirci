/**
 * İçimizdeki Tamirci — SQLite3 Tabanlı Veri & Analitik Motoru (sqlite-engine.js)
 * ShenApp mimarisi referans alınarak tasarlanmıştır.
 * Sıfır sahte veri: Sayaçlar 0'dan başlar, mobil ve masaüstü arasında gerçek zamanlı api.php senkronizasyonu sağlar.
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
      slug: 'rabia-alga',
      phpSlug: 'rabia-alga',
      htmlSlug: 'rabia-alga',
      name: 'Rabia Alga',
      role: 'Yüksek Mimar (UÜ & İTÜ)\nThetaHealing®, Grigori Grabovoi® & Silva Metodu Eğitmeni',
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
          embedUrl: 'https://www.youtube.com/watch?v=BgTwMiPETuY',
          active: true
        },
        {
          id: 'vid-ra-2',
          title: 'Sayılarla Nasıl Tanıştık?',
          embedUrl: 'https://www.youtube.com/watch?v=FAhJCpRIr9o',
          active: true
        }
      ]
    },
    'bedia-kahya-kilic': {
      id: 'bedia-kahya-kilic',
      slug: 'bedia-kahya-kilic',
      phpSlug: 'bedia-kahya-kilic',
      htmlSlug: 'bedia-kahya-kilic',
      name: 'Bedia Kahya Kılıç',
      role: 'Endüstri Mühendisi (MBA)\nThetaHealing® & Sayıların Şifası Eğitmeni',
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
          embedUrl: 'https://www.youtube.com/watch?v=BgTwMiPETuY',
          active: true
        },
        {
          id: 'vid-bk-2',
          title: 'Sayılarla Nasıl Tanıştık?',
          embedUrl: 'https://www.youtube.com/watch?v=FAhJCpRIr9o',
          active: true
        }
      ]
    }
  };

  /**
   * SQLite3 Veritabanı Modeli & Sunucu Senkronizasyon Katmanı
   */
  class SQLite3Database {
    constructor() {
      this.tables = {
        page_visits: [],      // id, profile_id, source, device, timestamp
        training_clicks: [],  // id, profile_id, training_id, training_title, source, device, timestamp
        profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
        admin_auth: { username: '1', password: '1' }
      };
      this.listeners = [];
      this.init();
    }

    init() {
      // 1. Önce hızlı yanıt için localStorage'dan oku
      try {
        const raw = localStorage.getItem(DB_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.tables && parsed.tables.profiles) {
            this.tables = parsed.tables;
          }
        }
      } catch (e) {
        console.warn('SQLite storage okuma hatası:', e);
      }

      // 2. Auth kontrolü
      try {
        const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        if (rawAuth) {
          const parsedAuth = JSON.parse(rawAuth);
          if (parsedAuth && parsedAuth.username && parsedAuth.password) {
            this.tables.admin_auth = parsedAuth;
          }
        }
      } catch (e) {}

      // 3. Hemen canlı sunucudan (api.php) güncel verileri çek ve senkronize et
      this.pullFromServer();

      // 4. Sekmeler arası BroadcastChannel dinle
      if (syncChannel) {
        syncChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'SQLITE_UPDATED') {
            this.pullFromServer();
          }
        };
      }

      // 5. Mobil sekme değişiminde (visibilitychange) otomatik senkronizasyon
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            this.pullFromServer();
          }
        });
      }
    }

    notifyListeners() {
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch (e) {}
      });
    }

    /**
     * api.php üzerinden en güncel sunucu verilerini çeker
     */
    async pullFromServer() {
      try {
        const resp = await fetch('api.php?_t=' + Date.now(), { cache: 'no-store' });
        if (!resp.ok) return false;
        const data = await resp.json();
        if (data && data.tables && data.tables.profiles && Object.keys(data.tables.profiles).length > 0) {
          this.tables = data.tables;
          try {
            localStorage.setItem(
              DB_STORAGE_KEY,
              JSON.stringify({
                engine: 'SQLite3',
                version: '3.45.1',
                updated_at: data.updated_at || new Date().toISOString(),
                tables: this.tables
              })
            );
          } catch (e) {}
          this.notifyListeners();
          return true;
        }
      } catch (e) {
        console.warn('api.php veri çekme atlandı/çevrimdışı:', e);
      }
      return false;
    }

    /**
     * Verileri yerel hafızaya ve api.php üzerinden sunucuya yazar
     */
    async commit(broadcast = true) {
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
        this.notifyListeners();

        // api.php üzerinden sunucuya yaz
        const res = await fetch('api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ok: true,
            tables: this.tables,
            updated_at: new Date().toISOString()
          })
        });
        return res.ok;
      } catch (e) {
        console.warn('SQLite commit / api.php yazma hatası:', e);
        return false;
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
    // Sıfır sahte veri: Yalnızca gerçek kayıtlar
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
        sources[s].visits++;
      });

      clicks.forEach((c) => {
        const s = c.source || 'direct';
        if (!sources[s]) sources[s] = { visits: 0, clicks: 0 };
        sources[s].clicks++;
      });

      // GROUP BY device
      const devices = { mobile: 0, desktop: 0 };
      visits.forEach((v) => {
        const d = v.device === 'mobile' ? 'mobile' : 'desktop';
        devices[d]++;
      });

      // GROUP BY training
      const trnMap = {};
      const profileIds = profileIdFilter === 'ALL' ? ['rabia-alga', 'bedia-kahya-kilic'] : [profileIdFilter];
      profileIds.forEach((pid) => {
        const pObj = this.tables.profiles[pid];
        if (pObj && pObj.trainings) {
          pObj.trainings.forEach((t) => {
            trnMap[t.id] = {
              id: t.id,
              profileId: pid,
              profileName: pObj.name,
              profileSlug: pObj.slug || pid,
              title: t.title,
              category: t.category,
              date: t.date,
              mode: t.mode,
              clicks: 0
            };
          });
        }
      });

      clicks.forEach((c) => {
        if (trnMap[c.training_id]) {
          trnMap[c.training_id].clicks++;
        } else {
          trnMap[c.training_id] = {
            id: c.training_id,
            profileId: c.profile_id,
            profileName: c.profile_id === 'rabia-alga' ? 'Rabia Alga' : 'Bedia Kahya Kılıç',
            profileSlug: c.profile_id,
            title: c.training_title,
            category: 'Diğer',
            date: '-',
            mode: 'Bilinmiyor',
            clicks: 1
          };
        }
      });

      const trainingsList = Object.values(trnMap).sort((a, b) => b.clicks - a.clicks);

      // Son 30 olay (Log)
      const recentEvents = [
        ...visits.map((v) => ({
          id: `v-${v.id}`,
          timestamp: v.timestamp,
          profileId: v.profile_id,
          profileSlug: v.profile_id,
          type: 'visit',
          label: 'Sayfa Görüntüleme',
          source: v.source,
          device: v.device
        })),
        ...clicks.map((c) => ({
          id: `c-${c.id}`,
          timestamp: c.timestamp,
          profileId: c.profile_id,
          profileSlug: c.profile_id,
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

    async saveProfileAsync(profileId, data) {
      this.tables.profiles[profileId] = data;
      return await this.commit(true);
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
      return this.commit(true);
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
    const utmSource = params.get('utm_source') || params.get('ref') || params.get('source');
    if (utmSource) {
      const low = utmSource.toLowerCase();
      if (low.includes('insta')) return 'instagram';
      if (low.includes('what') || low.includes('wa')) return 'whatsapp';
      if (low.includes('you')) return 'youtube';
      if (low.includes('goog')) return 'google';
      if (low.includes('twit') || low.includes('t.co') || low === 'x') return 'twitter';
      return low;
    }

    const ref = (document.referrer || '').toLowerCase();
    if (!ref) return 'direct';
    if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) return 'instagram';
    if (ref.includes('whatsapp.com') || ref.includes('api.whatsapp.com') || ref.includes('wa.me')) return 'whatsapp';
    if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'youtube';
    if (ref.includes('google.')) return 'google';
    if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'twitter';

    try {
      const host = new URL(ref).hostname.replace('www.', '');
      return host || 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  // Cihaz Türü Tespiti
  function detectDevice() {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
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
    async saveProfileAsync(id, data) {
      return await db.saveProfileAsync(id, data);
    },
    async pullFromServer() {
      return await db.pullFromServer();
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
      db.listeners.push(callback);
      if (syncChannel) {
        syncChannel.addEventListener('message', () => callback());
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
