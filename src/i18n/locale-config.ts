export const SUPPORTED_BLOG_LOCALES = [
	'ar',
	'de',
	'en',
	'es',
	'fr',
	'id',
	'it',
	'ja',
	'ko',
	'pl',
	'pt',
	'ru',
	'th',
	'tr',
	'uk',
	'vi',
	'zh-CN',
	'zh-TW',
] as const;

export type BlogSupportedLocale = (typeof SUPPORTED_BLOG_LOCALES)[number];

export const BLOG_INDEXED_LOCALES = [
	'en',
	'ar',
	'de',
	'es',
	'fr',
	'id',
	'it',
	'ja',
	'ko',
	'pl',
	'pt',
	'ru',
	'th',
	'tr',
	'uk',
	'vi',
	'zh-CN',
	'zh-TW',
] as const satisfies readonly BlogSupportedLocale[];

export const BLOG_SECONDARY_LOCALES = [] as const satisfies readonly BlogSupportedLocale[];

export const BLOG_ALL_LOCALE_INDEXED_SLUGS = [] as const;

export interface BlogLocaleMeta {
	native: string;
	flag: string;
	dir: 'ltr' | 'rtl';
	blogTitle: string;
	blogDescription: string;
	articlesHeading: string;
	relatedArticles: string;
	lastUpdatedOn: string;
	defaultLabel: string;
}

export interface BlogNavCopy {
	features: string;
	pricing: string;
	guides: string;
	blog: string;
	contactUs: string;
	login: string;
	signUp: string;
	homeAria: string;
	logoAlt: string;
}

export const BLOG_NAV_COPY: Record<BlogSupportedLocale, BlogNavCopy> = {
	ar: {
		features: 'الميزات',
		pricing: 'التسعير',
		guides: 'المرشدون',
		blog: 'مدونة',
		contactUs: 'اتصل بنا',
		login: 'تسجيل الدخول',
		signUp: 'إنشاء حساب',
		homeAria: 'الصفحة الرئيسية لـ SurtitleLive',
		logoAlt: 'شعار SurtitleLive',
	},
	de: {
		features: 'Funktionen',
		pricing: 'Preise',
		guides: 'Anleitungen',
		blog: 'Neuigkeiten',
		contactUs: 'Kontakt',
		login: 'Anmelden',
		signUp: 'Registrieren',
		homeAria: 'SurtitleLive Startseite',
		logoAlt: 'SurtitleLive Logo',
	},
	en: {
		features: 'Features',
		pricing: 'Pricing',
		guides: 'Guides',
		blog: 'Blog',
		contactUs: 'Contact Us',
		login: 'Login',
		signUp: 'Sign Up',
		homeAria: 'SurtitleLive home',
		logoAlt: 'SurtitleLive Logo',
	},
	es: {
		features: 'Funciones',
		pricing: 'Precios',
		guides: 'Guías',
		blog: 'Blog',
		contactUs: 'Contáctanos',
		login: 'Acceso',
		signUp: 'Registrarse',
		homeAria: 'Inicio de SurtitleLive',
		logoAlt: 'Logotipo de SurtitleLive',
	},
	fr: {
		features: 'Fonctionnalités',
		pricing: 'Tarifs',
		guides: 'Guides pratiques',
		blog: 'Actualités',
		contactUs: 'Contact',
		login: 'Connexion',
		signUp: "S'inscrire",
		homeAria: 'Accueil SurtitleLive',
		logoAlt: 'Logo SurtitleLive',
	},
	id: {
		features: 'Fitur',
		pricing: 'Harga',
		guides: 'Pemandu',
		blog: 'Blog',
		contactUs: 'Hubungi kami',
		login: 'Login',
		signUp: 'Buat akun',
		homeAria: 'Beranda SurtitleLive',
		logoAlt: 'Logo SurtitleLive',
	},
	it: {
		features: 'Funzionalità',
		pricing: 'Prezzi',
		guides: 'Guide',
		blog: 'Blog',
		contactUs: 'Contattaci',
		login: 'Login',
		signUp: 'Registrati',
		homeAria: 'Home di SurtitleLive',
		logoAlt: 'Logo SurtitleLive',
	},
	ja: {
		features: '機能',
		pricing: '料金',
		guides: 'ガイド',
		blog: 'ブログ',
		contactUs: 'お問い合わせ',
		login: 'ログイン',
		signUp: '新規登録',
		homeAria: 'SurtitleLive ホーム',
		logoAlt: 'SurtitleLive ロゴ',
	},
	ko: {
		features: '기능',
		pricing: '가격',
		guides: '가이드',
		blog: '블로그',
		contactUs: '문의하기',
		login: '로그인',
		signUp: '회원가입',
		homeAria: 'SurtitleLive 홈',
		logoAlt: 'SurtitleLive 로고',
	},
	pl: {
		features: 'Funkcje',
		pricing: 'Wycena',
		guides: 'Przewodniki',
		blog: 'Blog',
		contactUs: 'Skontaktuj się z nami',
		login: 'Login',
		signUp: 'Zarejestruj się',
		homeAria: 'Strona główna SurtitleLive',
		logoAlt: 'Logo SurtitleLive',
	},
	pt: {
		features: 'Funcionalidades',
		pricing: 'Preços',
		guides: 'Guias',
		blog: 'Blog',
		contactUs: 'Contate-nos',
		login: 'Conecte-se',
		signUp: 'Criar conta',
		homeAria: 'Página inicial da SurtitleLive',
		logoAlt: 'Logotipo da SurtitleLive',
	},
	ru: {
		features: 'Функции',
		pricing: 'Цены',
		guides: 'Гиды',
		blog: 'Блог',
		contactUs: 'Связаться с нами',
		login: 'Авторизоваться',
		signUp: 'Зарегистрироваться',
		homeAria: 'Главная страница SurtitleLive',
		logoAlt: 'Логотип SurtitleLive',
	},
	th: {
		features: 'คุณสมบัติ',
		pricing: 'ราคา',
		guides: 'คู่มือ',
		blog: 'บล็อก',
		contactUs: 'ติดต่อเรา',
		login: 'เข้าสู่ระบบ',
		signUp: 'ลงทะเบียน',
		homeAria: 'หน้าแรก SurtitleLive',
		logoAlt: 'โลโก้ SurtitleLive',
	},
	tr: {
		features: 'Özellikler',
		pricing: 'Fiyatlandırma',
		guides: 'Rehberler',
		blog: 'Blog',
		contactUs: 'Bize Ulaşın',
		login: 'Giriş yapmak',
		signUp: 'Kaydol',
		homeAria: 'SurtitleLive ana sayfası',
		logoAlt: 'SurtitleLive logosu',
	},
	uk: {
		features: 'Функції',
		pricing: 'Ціноутворення',
		guides: 'Путівники',
		blog: 'Блог',
		contactUs: "Зв'яжіться з нами",
		login: 'Вхід',
		signUp: 'Зареєструватися',
		homeAria: 'Головна сторінка SurtitleLive',
		logoAlt: 'Логотип SurtitleLive',
	},
	vi: {
		features: 'Tính năng',
		pricing: 'Giá cả',
		guides: 'Hướng dẫn',
		blog: 'Blog',
		contactUs: 'Liên hệ với chúng tôi',
		login: 'Đăng nhập',
		signUp: 'Đăng ký',
		homeAria: 'Trang chủ SurtitleLive',
		logoAlt: 'Logo SurtitleLive',
	},
	'zh-CN': {
		features: '功能',
		pricing: '价格',
		guides: '指南',
		blog: '博客',
		contactUs: '联系我们',
		login: '登录',
		signUp: '注册',
		homeAria: 'SurtitleLive 首页',
		logoAlt: 'SurtitleLive 标志',
	},
	'zh-TW': {
		features: '功能',
		pricing: '定價',
		guides: '指南',
		blog: '部落格',
		contactUs: '聯絡我們',
		login: '登入',
		signUp: '註冊',
		homeAria: 'SurtitleLive 首頁',
		logoAlt: 'SurtitleLive 標誌',
	},
};

export const BLOG_LOCALE_META: Record<BlogSupportedLocale, BlogLocaleMeta> = {
	ar: {
		native: 'العربية',
		flag: '🇸🇦',
		dir: 'rtl',
		blogTitle: 'مدونة SurtitleLive',
		blogDescription: 'إرشادات عملية لفرق المسرح والأوبرا والمهرجانات حول الترجمة المكتوبة والتعليقات الحية ومراجعة الترجمة والعرض على الشاشة وهواتف الجمهور وتشغيل العرض.',
		articlesHeading: 'مقالات مختارة',
		relatedArticles: 'مقالات ذات صلة',
		lastUpdatedOn: 'آخر تحديث في',
		defaultLabel: 'اللغة الافتراضية',
	},
	de: {
		native: 'Deutsch',
		flag: '🇩🇪',
		dir: 'ltr',
		blogTitle: 'SurtitleLive Blog',
		blogDescription: 'Praxiswissen für Theater-, Opern- und Festivalteams zu Übertiteln, Live-Untertiteln, Übersetzungsprüfung, Projektion, Publikumshandys und Vorstellungsbetrieb.',
		articlesHeading: 'Ausgewählte Artikel',
		relatedArticles: 'Ähnliche Artikel',
		lastUpdatedOn: 'Zuletzt aktualisiert am',
		defaultLabel: 'Standard',
	},
	en: {
		native: 'English',
		flag: '🇬🇧',
		dir: 'ltr',
		blogTitle: 'SurtitleLive Blog',
		blogDescription: 'Practical guidance for theatre, opera and festival teams on surtitles, live captions, translation review, projection, audience phones and show-day operation.',
		articlesHeading: 'Featured Articles',
		relatedArticles: 'Related Articles',
		lastUpdatedOn: 'Last updated on',
		defaultLabel: 'Default',
	},
	es: {
		native: 'Español',
		flag: '🇪🇸',
		dir: 'ltr',
		blogTitle: 'Blog de SurtitleLive',
		blogDescription: 'Guías para equipos de teatro, ópera y festivales sobre sobretítulos, subtítulos en vivo, revisión de traducciones, proyección, móviles del público y operación.',
		articlesHeading: 'Artículos destacados',
		relatedArticles: 'Artículos relacionados',
		lastUpdatedOn: 'Última actualización el',
		defaultLabel: 'Predeterminado',
	},
	fr: {
		native: 'Français',
		flag: '🇫🇷',
		dir: 'ltr',
		blogTitle: 'Blog SurtitleLive',
		blogDescription: 'Guides pour les équipes de théâtre, opéra et festival sur les surtitres, le direct, la révision, la projection, les mobiles du public et la régie.',
		articlesHeading: 'Articles à la une',
		relatedArticles: 'Articles liés',
		lastUpdatedOn: 'Dernière mise à jour le',
		defaultLabel: 'Par défaut',
	},
	id: {
		native: 'Bahasa Indonesia',
		flag: '🇮🇩',
		dir: 'ltr',
		blogTitle: 'Blog SurtitleLive',
		blogDescription: 'Panduan bagi tim teater, opera, festival tentang subtitel panggung, caption langsung, tinjauan terjemahan, proyeksi, ponsel penonton, dan operasi pertunjukan.',
		articlesHeading: 'Artikel pilihan',
		relatedArticles: 'Artikel terkait',
		lastUpdatedOn: 'Terakhir diperbarui pada',
		defaultLabel: 'Default',
	},
	it: {
		native: 'Italiano',
		flag: '🇮🇹',
		dir: 'ltr',
		blogTitle: 'Blog SurtitleLive',
		blogDescription: 'Guide per team di teatro, opera e festival su sopratitoli, sottotitoli live, revisione, proiezione, smartphone del pubblico e gestione dello spettacolo.',
		articlesHeading: 'Articoli in evidenza',
		relatedArticles: 'Articoli correlati',
		lastUpdatedOn: 'Ultimo aggiornamento il',
		defaultLabel: 'Predefinito',
	},
	ja: {
		native: '日本語',
		flag: '🇯🇵',
		dir: 'ltr',
		blogTitle: 'SurtitleLive ブログ',
		blogDescription: '劇場・オペラ・フェスティバルの制作チーム向けに、舞台字幕、リアルタイム字幕、翻訳レビュー、会場投影、観客のスマートフォン配信、本番運用を実務目線で解説します。',
		articlesHeading: '注目の記事',
		relatedArticles: '関連記事',
		lastUpdatedOn: '最終更新日',
		defaultLabel: '既定',
	},
	ko: {
		native: '한국어',
		flag: '🇰🇷',
		dir: 'ltr',
		blogTitle: 'SurtitleLive 블로그',
		blogDescription: '극장·오페라·페스티벌 제작팀을 위한 공연 자막, 실시간 캡션, 번역 검토, 프로젝션, 관객 휴대전화 전달과 공연 당일 운영 실무 가이드입니다.',
		articlesHeading: '추천 글',
		relatedArticles: '관련 글',
		lastUpdatedOn: '마지막 업데이트',
		defaultLabel: '기본값',
	},
	pl: {
		native: 'Polski',
		flag: '🇵🇱',
		dir: 'ltr',
		blogTitle: 'Blog SurtitleLive',
		blogDescription: 'Poradniki dla zespołów teatralnych, operowych i festiwalowych o nadtytułach, napisach na żywo, tłumaczeniach, projekcji, telefonach widzów i obsłudze.',
		articlesHeading: 'Polecane artykuły',
		relatedArticles: 'Powiązane artykuły',
		lastUpdatedOn: 'Ostatnia aktualizacja',
		defaultLabel: 'Domyślny',
	},
	pt: {
		native: 'Português',
		flag: '🇵🇹',
		dir: 'ltr',
		blogTitle: 'Blog da SurtitleLive',
		blogDescription: 'Guias para equipas de teatro, ópera e festivais sobre legendagem, revisão, projeção, telemóveis do público e operação durante o espetáculo.',
		articlesHeading: 'Artigos em destaque',
		relatedArticles: 'Artigos relacionados',
		lastUpdatedOn: 'Última atualização em',
		defaultLabel: 'Padrão',
	},
	ru: {
		native: 'Русский',
		flag: '🇷🇺',
		dir: 'ltr',
		blogTitle: 'Блог SurtitleLive',
		blogDescription: 'Практические руководства для театральных, оперных и фестивальных команд о титрах, живых субтитрах, проверке перевода, проекции и работе во время показа.',
		articlesHeading: 'Избранные статьи',
		relatedArticles: 'Связанные статьи',
		lastUpdatedOn: 'Последнее обновление',
		defaultLabel: 'По умолчанию',
	},
	th: {
		native: 'ไทย',
		flag: '🇹🇭',
		dir: 'ltr',
		blogTitle: 'บล็อก SurtitleLive',
		blogDescription: 'คู่มือเชิงปฏิบัติสำหรับทีมละคร โอเปรา และเทศกาล เกี่ยวกับคำบรรยายบนเวที คำบรรยายสด การตรวจทานคำแปล การฉายภาพ โทรศัพท์ของผู้ชม และการควบคุมในวันแสดง',
		articlesHeading: 'บทความแนะนำ',
		relatedArticles: 'บทความที่เกี่ยวข้อง',
		lastUpdatedOn: 'อัปเดตล่าสุดเมื่อ',
		defaultLabel: 'ค่าเริ่มต้น',
	},
	tr: {
		native: 'Türkçe',
		flag: '🇹🇷',
		dir: 'ltr',
		blogTitle: 'SurtitleLive Blog',
		blogDescription: 'Tiyatro, opera ve festival ekipleri için üst yazı, canlı altyazı, çeviri incelemesi, projeksiyon, seyirci telefonları ve gösteri işletimi rehberleri.',
		articlesHeading: 'Öne çıkan yazılar',
		relatedArticles: 'İlgili yazılar',
		lastUpdatedOn: 'Son güncelleme',
		defaultLabel: 'Varsayılan',
	},
	uk: {
		native: 'Українська',
		flag: '🇺🇦',
		dir: 'ltr',
		blogTitle: 'Блог SurtitleLive',
		blogDescription: 'Практичні поради для театральних, оперних і фестивальних команд про титри, живі субтитри, перевірку перекладу, проєкцію та роботу під час вистави.',
		articlesHeading: 'Вибрані статті',
		relatedArticles: 'Пов’язані статті',
		lastUpdatedOn: 'Останнє оновлення',
		defaultLabel: 'Типово',
	},
	vi: {
		native: 'Tiếng Việt',
		flag: '🇻🇳',
		dir: 'ltr',
		blogTitle: 'Blog SurtitleLive',
		blogDescription: 'Hướng dẫn cho ê-kíp sân khấu, opera và liên hoan về phụ đề sân khấu, phụ đề trực tiếp, rà soát bản dịch, trình chiếu, điện thoại khán giả và vận hành buổi diễn.',
		articlesHeading: 'Bài viết nổi bật',
		relatedArticles: 'Bài viết liên quan',
		lastUpdatedOn: 'Cập nhật lần cuối vào',
		defaultLabel: 'Mặc định',
	},
	'zh-CN': {
		native: '简体中文',
		flag: '🇨🇳',
		dir: 'ltr',
		blogTitle: 'SurtitleLive 博客',
		blogDescription: '面向剧场、歌剧与艺术节团队的完整实务指南，涵盖舞台字幕、实时字幕、翻译审校、现场投影、观众手机传送及演出当天的操作流程。',
		articlesHeading: '精选文章',
		relatedArticles: '相关文章',
		lastUpdatedOn: '最后更新于',
		defaultLabel: '默认',
	},
	'zh-TW': {
		native: '繁體中文',
		flag: '🇹🇼',
		dir: 'ltr',
		blogTitle: 'SurtitleLive 部落格',
		blogDescription: '面向劇場、歌劇與藝術節團隊的完整實務指南，涵蓋舞台字幕、即時字幕、翻譯審校、現場投影、觀眾手機傳送及演出當天的操作流程。',
		articlesHeading: '精選文章',
		relatedArticles: '相關文章',
		lastUpdatedOn: '最後更新於',
		defaultLabel: '預設',
	},
};

export function isBlogSupportedLocale(value: unknown): value is BlogSupportedLocale {
	return typeof value === 'string' && (SUPPORTED_BLOG_LOCALES as readonly string[]).includes(value);
}

export function isBlogIndexedLocale(value: unknown): value is BlogSupportedLocale {
	return typeof value === 'string' && (BLOG_INDEXED_LOCALES as readonly string[]).includes(value);
}

export function isBlogArticleIndexable(locale: unknown, slug: unknown): boolean {
	return isBlogIndexedLocale(locale)
		|| (isBlogSupportedLocale(locale) && typeof slug === 'string' && BLOG_ALL_LOCALE_INDEXED_SLUGS.includes(slug as (typeof BLOG_ALL_LOCALE_INDEXED_SLUGS)[number]));
}

export function resolveBlogLocaleMeta(value: unknown): BlogLocaleMeta {
	return BLOG_LOCALE_META[isBlogSupportedLocale(value) ? value : 'en'];
}

export function resolveBlogNavCopy(value: unknown): BlogNavCopy {
	return BLOG_NAV_COPY[isBlogSupportedLocale(value) ? value : 'en'];
}
