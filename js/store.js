/**
 * İçimizdeki Tamirci — Veri, CMS, Analitik ve Kimlik Doğrulama Motoru (store.js)
 */

const STORAGE_KEY = 'icimizdeki_tamirci_cms_v2';
const ANALYTICS_KEY = 'icimizdeki_tamirci_analytics_v2';
const AUTH_KEY = 'icimizdeki_tamirci_auth_v2';
const SESSION_SOURCE_KEY = 'icimizdeki_tamirci_visitor_source';
const SESSION_AUTH_KEY = 'icimizdeki_tamirci_admin_logged_in';
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('icimizdeki_tamirci_sync') : null;

const DEFAULT_AUTH = {
  username: '1',
  password: '1'
};

const DEFAULT_DATA = {
  site: {
    brandName: 'İçimizdeki Tamirci',
    domain: 'icimizdekitamirci.com',
    footerText: '© 2026 İçimizdeki Tamirci | Bütün Hakları Saklıdır.',
    agencyName: 'Shen Ajans',
    agencyUrl: 'https://www.shenajans.com/'
  },
  profiles: {
    'rabia-alga': {
      id: 'rabia-alga',
      phpSlug: 'rabia-alga.php',
      htmlSlug: 'rabia-alga.html',
      name: 'Rabia Alga',
      role: 'Yüksek Mimar (UÜ & İTÜ) · Eğitmen & Kurucu',
      credentials: 'ThetaHealing® · Silva Metodu · Grigori Grabovoi® · Home By RA®',
      location: 'İstanbul, Türkiye',
      avatar: 'assets/images/RabiaAlga.jpg',
      bgImage: 'assets/images/back.jpg',
      greeting: 'Merhaba, Ben Rabia Alga',
      bio: 'Hepiniz sevgiyle hoşgeldiniz! Ben Rabia Alga. Yüksek Mimarım (UÜ & İTÜ), mimarlık alanında ilerlemeyi hedeflediğim kariyer basamaklarımda yolum fuarcılık sektörüyle kesişti. Yoğun tempoda devam eden kariyer hayatım boyunca, oğlumun sık hastalanmasıyla girdiğim yan etkisiz çözüm arayışlarında Homeopati ile tanıştım. Bu, mucize olmalıydı, içinde madde olmayan bir şeyle kişi şifalanabiliyordu. Hastalıkların altında duygusal sebepler yatabileceğini öğrendim, araştırmaya başladım. Araştırmalarım beni sayıların şifasıyla ve daha birçok öğretiyle buluşturdu.',
      moreLabel: 'Daha Fazlası İçin...',
      moreUrl: 'https://www.rabiaalga.com/sayfa/rabia-alga',
      accentColor: '#02a3c4',
      whatsappNumber: '',
      socials: [
        { id: 'soc-ra-email', platform: 'email', label: 'E-Posta', handle: 'info@rabiaalga.com', url: 'mailto:info@rabiaalga.com', active: true },
        { id: 'soc-ra-instagram', platform: 'instagram', label: 'Instagram', handle: '@rabiaalga', url: 'https://www.instagram.com/rabiaalga/', active: true },
        { id: 'soc-ra-twitter', platform: 'twitter', label: 'Twitter / X', handle: '@RabiaAlga', url: 'https://twitter.com/RabiaAlga', active: true },
        { id: 'soc-ra-youtube', platform: 'youtube', label: 'YouTube', handle: '@farkindaliksohbetleri', url: 'https://www.youtube.com/@farkindaliksohbetleri', active: true },
        { id: 'soc-ra-website', platform: 'website', label: 'Web Sitesi', handle: 'rabiaalga.com', url: 'https://www.rabiaalga.com/', active: true }
      ],
      scheduleNote: `Basic DNA-Temel Seviye Semineri
6-7-8 Kasım 2026 / 09.30-17.30
Nida Kule - İstanbul
(Kayıtlarımız devam etmektedir.)

Silva Metodu Semineri
21-22 Kasım ve 28-29 Kasım 2026 / 10.00-20.00
Online - Zoom
(Kayıtlarımız devam etmektedir.)

Advanced DNA-İleri Seviye Semineri
18-19-20 Aralık 2026 / 09.30-17.30
Nida Kule - İstanbul
(Kayıtlarımız devam etmektedir.)

Silva Metodu Semineri
3-4 Nisan ve 10-11 Nisan 2027 / 08.30-19.30
Ankara - Kızılay
(Kayıtlarımız devam etmektedir.)`,
      trainings: [
        {
          id: 'trn-ra-1',
          title: 'Temel DNA Semineri - KATIL',
          pillText: 'İstanbul - 6-8 Kasım',
          date: '6-7-8 Kasım 2026',
          location: 'İstanbul',
          mode: 'Yüz Yüze',
          url: 'https://www.rabiaalga.com/urun/6-8-kasim-2026-basic-dna-semineri',
          active: true
        },
        {
          id: 'trn-ra-2',
          title: 'Silva Methodu - KATIL',
          pillText: 'ONLINE - 21-22 / 28-29 Kasım',
          date: '21-22 / 28-29 Kasım 2026',
          location: 'Online',
          mode: 'Online',
          url: 'https://www.rabiaalga.com/urun/online-silva-metodu-semineri-kasim-2026?AppLanguageCode=tr',
          active: true
        },
        {
          id: 'trn-ra-3',
          title: 'İleri DNA Semineri - KATIL',
          pillText: 'İstanbul - 18-20 Aralık',
          date: '18-19-20 Aralık 2026',
          location: 'İstanbul',
          mode: 'Yüz Yüze',
          url: 'https://www.rabiaalga.com/urun/11-13-aralik-2026-advanced-dna-semineri',
          active: true
        },
        {
          id: 'trn-ra-4',
          title: 'Silva Methodu - KATIL',
          pillText: 'Ankara - 3-4 ve 10-11 Nisan',
          date: '3-4 ve 10-11 Nisan 2027',
          location: 'Ankara',
          mode: 'Yüz Yüze',
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
      credentials: 'ThetaHealing® · Sayıların Şifası · Farkındalık Sohbetleri',
      location: 'Bursa & İstanbul, Türkiye',
      avatar: 'assets/images/BediaKahyaKilic.jpg',
      bgImage: 'assets/images/back.jpg',
      greeting: 'Merhaba, Ben Bedia Kahya Kılıç',
      bio: 'MBA yapmış bir Endüstri Mühendisiyim. Yaklaşık 5 yıl kurumsal ve uluslararası firmalarda profesyonel hayatı deneyimledikten sonra evlenip Bursa’ya yerleştim. Benim için asıl eğitim hayatı o zaman başladı diyebilirim. Akıllı geçinen aptallardan olduğumu, aslında hiç ilgimi çekmeyen ve keyif vermeyen bölümlerde yıllarca dirsek çürüttüğümü anlayıp önce üzülmem sonra aslında ne kadar hayrıma olduğunun farkına varmam hep bundan sonra oldu..',
      moreLabel: 'Daha Fazlası İçin...',
      moreUrl: 'https://bediakahyakilic.com/hakkimda/',
      accentColor: '#02a3c4',
      whatsappNumber: '',
      socials: [
        { id: 'soc-bk-email', platform: 'email', label: 'E-Posta', handle: 'bediakahya@gmail.com', url: 'mailto:bediakahya@gmail.com', active: true },
        { id: 'soc-bk-instagram', platform: 'instagram', label: 'Instagram', handle: '@bediakahyakilic', url: 'https://www.instagram.com/bediakahyakilic/', active: true },
        { id: 'soc-bk-twitter', platform: 'twitter', label: 'Twitter / X', handle: '@BediaKahyaKILIC', url: 'https://twitter.com/BediaKahyaKILIC', active: true },
        { id: 'soc-bk-youtube', platform: 'youtube', label: 'YouTube', handle: '@farkindaliksohbetleri', url: 'https://www.youtube.com/@farkindaliksohbetleri', active: true },
        { id: 'soc-bk-website', platform: 'website', label: 'Web Sitesi', handle: 'bediakahyakilic.com', url: 'https://bediakahyakilic.com/', active: true }
      ],
      scheduleNote: `Basic DNA-Temel Seviye Semineri
6-7-8 Kasım 2026 / 09.30-17.30
Nida Kule - İstanbul
(Kayıtlarımız devam etmektedir.)

Advanced DNA-İleri Seviye Semineri
18-19-20 Aralık 2026 / 09.30-17.30
Nida Kule - İstanbul
(Kayıtlarımız devam etmektedir.)`,
      trainings: [
        {
          id: 'trn-bk-1',
          title: 'Temel DNA Semineri - KATIL',
          pillText: 'İstanbul - 6-8 Kasım',
          date: '6-7-8 Kasım 2026',
          location: 'İstanbul',
          mode: 'Yüz Yüze',
          url: 'https://www.rabiaalga.com/urun/6-8-kasim-2026-basic-dna-semineri',
          active: true
        },
        {
          id: 'trn-bk-2',
          title: 'İleri DNA Semineri - KATIL',
          pillText: 'İstanbul - 18-20 Aralık',
          date: '18-19-20 Aralık 2026',
          location: 'İstanbul',
          mode: 'Yüz Yüze',
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
  }
};

function generateInitialAnalytics() {
  const now = new Date();
  const daily = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    daily[key] = {
      'rabia-alga': {
        visits: 72 + ((i * 17) % 45),
        clicks: 29 + ((i * 11) % 22)
      },
      'bedia-kahya-kilic': {
        visits: 54 + ((i * 13) % 38),
        clicks: 21 + ((i * 9) % 16)
      }
    };
  }

  return {
    summary: {
      'rabia-alga': {
        totalVisits: 1248,
        uniqueVisitors: 984,
        totalClicks: 486,
        sources: {
          instagram: { visits: 684, clicks: 278 },
          whatsapp: { visits: 312, clicks: 139 },
          youtube: { visits: 124, clicks: 41 },
          google: { visits: 62, clicks: 16 },
          twitter: { visits: 28, clicks: 5 },
          direct: { visits: 38, clicks: 7 }
        },
        devices: {
          mobile: 1012,
          desktop: 236
        },
        trainingClicks: {
          'trn-ra-1': {
            title: 'Temel DNA Semineri - KATIL (İstanbul - 6-8 Kasım)',
            clicks: 184,
            bySource: { instagram: 108, whatsapp: 52, youtube: 14, google: 6, direct: 4, twitter: 0 }
          },
          'trn-ra-2': {
            title: 'Silva Methodu - KATIL (ONLINE - 21-22 / 28-29 Kasım)',
            clicks: 152,
            bySource: { instagram: 84, whatsapp: 48, youtube: 12, google: 5, direct: 2, twitter: 1 }
          },
          'trn-ra-3': {
            title: 'İleri DNA Semineri - KATIL (İstanbul - 18-20 Aralık)',
            clicks: 86,
            bySource: { instagram: 51, whatsapp: 22, youtube: 8, google: 3, direct: 1, twitter: 1 }
          },
          'trn-ra-4': {
            title: 'Silva Methodu - KATIL (Ankara - 3-4 ve 10-11 Nisan)',
            clicks: 64,
            bySource: { instagram: 35, whatsapp: 17, youtube: 7, google: 2, direct: 0, twitter: 3 }
          }
        },
        socialClicks: {
          instagram: 94,
          youtube: 67,
          website: 82,
          email: 19,
          twitter: 14,
          moreBio: 58
        }
      },
      'bedia-kahya-kilic': {
        totalVisits: 942,
        uniqueVisitors: 761,
        totalClicks: 348,
        sources: {
          instagram: { visits: 538, clicks: 204 },
          whatsapp: { visits: 218, clicks: 94 },
          youtube: { visits: 96, clicks: 31 },
          google: { visits: 44, clicks: 11 },
          twitter: { visits: 19, clicks: 4 },
          direct: { visits: 27, clicks: 4 }
        },
        devices: {
          mobile: 758,
          desktop: 184
        },
        trainingClicks: {
          'trn-bk-1': {
            title: 'Temel DNA Semineri - KATIL (İstanbul - 6-8 Kasım)',
            clicks: 214,
            bySource: { instagram: 128, whatsapp: 58, youtube: 18, google: 7, direct: 2, twitter: 1 }
          },
          'trn-bk-2': {
            title: 'İleri DNA Semineri - KATIL (İstanbul - 18-20 Aralık)',
            clicks: 134,
            bySource: { instagram: 76, whatsapp: 36, youtube: 13, google: 4, direct: 2, twitter: 3 }
          }
        },
        socialClicks: {
          instagram: 78,
          youtube: 54,
          website: 69,
          email: 15,
          twitter: 11,
          moreBio: 49
        }
      }
    },
    daily,
    recentEvents: [
      {
        id: 'evt-1',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        profileId: 'rabia-alga',
        profileSlug: 'rabia-alga.php',
        type: 'training_click',
        label: 'Silva Methodu - KATIL (Online)',
        source: 'whatsapp',
        device: 'mobile'
      },
      {
        id: 'evt-2',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        profileId: 'rabia-alga',
        profileSlug: 'rabia-alga.php',
        type: 'training_click',
        label: 'Temel DNA Semineri - KATIL (İstanbul)',
        source: 'instagram',
        device: 'mobile'
      },
      {
        id: 'evt-3',
        timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
        profileId: 'bedia-kahya-kilic',
        profileSlug: 'bedia-kahya-kilic.php',
        type: 'training_click',
        label: 'Temel DNA Semineri - KATIL (İstanbul)',
        source: 'instagram',
        device: 'desktop'
      },
      {
        id: 'evt-4',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        profileId: 'bedia-kahya-kilic',
        profileSlug: 'bedia-kahya-kilic.php',
        type: 'visit',
        label: 'Sayfa Görüntüleme',
        source: 'whatsapp',
        device: 'mobile'
      }
    ]
  };
}

const SOURCE_META = {
  instagram: { label: 'Instagram', color: '#E1306C', bg: '#FDF2F6', icon: 'instagram' },
  whatsapp: { label: 'WhatsApp', color: '#168C46', bg: '#EEFBF3', icon: 'whatsapp' },
  youtube: { label: 'YouTube', color: '#D92525', bg: '#FEF2F2', icon: 'youtube' },
  google: { label: 'Google Arama', color: '#2563EB', bg: '#EFF6FF', icon: 'search' },
  twitter: { label: 'X (Twitter)', color: '#334155', bg: '#F1F5F9', icon: 'twitter' },
  direct: { label: 'Direkt Giriş / Link', color: '#02a3c4', bg: '#E6F8FB', icon: 'link' }
};

const Store = {
  SOURCE_META,

  /* Kimlik Doğrulama / Admin Şifre Yönetimi */
  getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && parsed.password) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Auth okuma hatası:', e);
    }
    return { ...DEFAULT_AUTH };
  },

  saveAuth(auth) {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      return true;
    } catch (e) {
      console.warn('Auth kaydetme hatası:', e);
      return false;
    }
  },

  verifyLogin(username, password) {
    const auth = this.getAuth();
    const ok = String(username).trim() === String(auth.username).trim() &&
               String(password).trim() === String(auth.password).trim();
    if (ok) {
      sessionStorage.setItem(SESSION_AUTH_KEY, '1');
    }
    return ok;
  },

  isAdminLoggedIn() {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === '1';
  },

  logoutAdmin() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  },

  /* CMS Veri Yönetimi */
  getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && parsed.profiles['rabia-alga'] && parsed.profiles['bedia-kahya-kilic']) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('localStorage okuma hatası:', e);
    }
    const copy = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData(copy, false);
    return copy;
  },

  saveData(data, broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (broadcast && syncChannel) {
        syncChannel.postMessage({ type: 'CMS_UPDATED', timestamp: Date.now() });
      }
      fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {
      console.warn('Veri kaydetme hatası:', e);
    }
  },

  getProfile(profileId) {
    const data = this.getData();
    return data.profiles[profileId] || data.profiles['rabia-alga'];
  },

  updateProfile(profileId, updatedProfile) {
    const data = this.getData();
    data.profiles[profileId] = updatedProfile;
    this.saveData(data, true);
    this.syncAnalyticsTrainings(profileId, updatedProfile.trainings || []);
    return updatedProfile;
  },

  resetToDefaults() {
    const copy = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData(copy, true);
    this.saveAuth({ ...DEFAULT_AUTH });
    return copy;
  },

  /* Analitik Yönetimi */
  getAnalytics() {
    try {
      const raw = localStorage.getItem(ANALYTICS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.summary) return parsed;
      }
    } catch (e) {
      console.warn('Analytics okuma hatası:', e);
    }
    const initial = generateInitialAnalytics();
    this.saveAnalytics(initial, false);
    return initial;
  },

  saveAnalytics(analytics, broadcast = true) {
    try {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
      if (broadcast && syncChannel) {
        syncChannel.postMessage({ type: 'ANALYTICS_UPDATED', timestamp: Date.now() });
      }
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analytics)
      }).catch(() => {});
    } catch (e) {
      console.warn('Analytics kaydetme hatası:', e);
    }
  },

  syncAnalyticsTrainings(profileId, trainings) {
    const analytics = this.getAnalytics();
    const profSummary = analytics.summary[profileId];
    if (!profSummary) return;
    trainings.forEach((t) => {
      const fullLabel = t.pillText ? `${t.title} (${t.pillText})` : t.title;
      if (!profSummary.trainingClicks[t.id]) {
        profSummary.trainingClicks[t.id] = {
          title: fullLabel,
          clicks: 0,
          bySource: { instagram: 0, whatsapp: 0, youtube: 0, google: 0, direct: 0, twitter: 0 }
        };
      } else {
        profSummary.trainingClicks[t.id].title = fullLabel;
      }
    });
    this.saveAnalytics(analytics, true);
  },

  detectVisitorSource() {
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
  },

  detectDevice() {
    const ua = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    return isMobile ? 'mobile' : 'desktop';
  },

  recordVisit(profileId, overrideSource = null, overrideDevice = null) {
    const analytics = this.getAnalytics();
    const profSummary = analytics.summary[profileId];
    if (!profSummary) return;

    const source = overrideSource || this.detectVisitorSource();
    const device = overrideDevice || this.detectDevice();
    sessionStorage.setItem(SESSION_SOURCE_KEY, source);

    profSummary.totalVisits += 1;

    const uniqueKey = `visited_${profileId}`;
    if (!sessionStorage.getItem(uniqueKey)) {
      profSummary.uniqueVisitors += 1;
      sessionStorage.setItem(uniqueKey, '1');
    }

    if (!profSummary.sources[source]) {
      profSummary.sources[source] = { visits: 0, clicks: 0 };
    }
    profSummary.sources[source].visits += 1;
    profSummary.devices[device] = (profSummary.devices[device] || 0) + 1;

    const todayKey = new Date().toISOString().slice(0, 10);
    if (!analytics.daily[todayKey]) {
      analytics.daily[todayKey] = {
        'rabia-alga': { visits: 0, clicks: 0 },
        'bedia-kahya-kilic': { visits: 0, clicks: 0 }
      };
    }
    analytics.daily[todayKey][profileId].visits += 1;

    analytics.recentEvents.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      profileId,
      profileSlug: profileId === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
      type: 'visit',
      label: 'Sayfa Girişi',
      source,
      device
    });
    analytics.recentEvents = analytics.recentEvents.slice(0, 40);

    this.saveAnalytics(analytics, true);
    return { source, device };
  },

  recordTrainingClick(profileId, training, overrideSource = null, overrideDevice = null) {
    const analytics = this.getAnalytics();
    const profSummary = analytics.summary[profileId];
    if (!profSummary) return;

    const source = overrideSource || this.detectVisitorSource();
    const device = overrideDevice || this.detectDevice();
    const fullTitle = training.pillText ? `${training.title} (${training.pillText})` : training.title;

    profSummary.totalClicks += 1;
    if (!profSummary.sources[source]) {
      profSummary.sources[source] = { visits: 1, clicks: 0 };
    }
    profSummary.sources[source].clicks += 1;

    if (!profSummary.trainingClicks[training.id]) {
      profSummary.trainingClicks[training.id] = {
        title: fullTitle,
        clicks: 0,
        bySource: { instagram: 0, whatsapp: 0, youtube: 0, google: 0, direct: 0, twitter: 0 }
      };
    }
    profSummary.trainingClicks[training.id].title = fullTitle;
    profSummary.trainingClicks[training.id].clicks += 1;
    profSummary.trainingClicks[training.id].bySource[source] =
      (profSummary.trainingClicks[training.id].bySource[source] || 0) + 1;

    const todayKey = new Date().toISOString().slice(0, 10);
    if (!analytics.daily[todayKey]) {
      analytics.daily[todayKey] = {
        'rabia-alga': { visits: 1, clicks: 0 },
        'bedia-kahya-kilic': { visits: 1, clicks: 0 }
      };
    }
    analytics.daily[todayKey][profileId].clicks += 1;

    analytics.recentEvents.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      profileId,
      profileSlug: profileId === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
      type: 'training_click',
      label: fullTitle,
      source,
      device
    });
    analytics.recentEvents = analytics.recentEvents.slice(0, 40);

    this.saveAnalytics(analytics, true);
  },

  recordSocialClick(profileId, platform, label) {
    const analytics = this.getAnalytics();
    const profSummary = analytics.summary[profileId];
    if (!profSummary) return;

    const source = this.detectVisitorSource();
    const device = this.detectDevice();

    profSummary.socialClicks[platform] = (profSummary.socialClicks[platform] || 0) + 1;

    analytics.recentEvents.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      profileId,
      profileSlug: profileId === 'rabia-alga' ? 'rabia-alga.php' : 'bedia-kahya-kilic.php',
      type: 'social_click',
      label: `${label} Bağlantısı`,
      source,
      device
    });
    analytics.recentEvents = analytics.recentEvents.slice(0, 40);

    this.saveAnalytics(analytics, true);
  },

  onSync(callback) {
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        callback(event.data);
      };
    }
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY || e.key === ANALYTICS_KEY || e.key === AUTH_KEY) {
        callback({ type: 'STORAGE_CHANGED', key: e.key });
      }
    });
  }
};

window.ITStore = Store;
