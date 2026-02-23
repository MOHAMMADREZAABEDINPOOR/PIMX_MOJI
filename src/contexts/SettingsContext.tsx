import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type Language = 'en' | 'fa';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'hero.badge': 'The Future of Digital Art',
    'hero.title.prefix': 'PIMX',
    'hero.title.suffix': 'MOJI',
    'hero.description': 'Transform ordinary pixels into extraordinary ASCII, Mosaic, and Emoji masterpieces.',
    'hero.cta.start': 'START CREATING',
    'hero.cta.telegram': 'JOIN TELEGRAM',
    'stats.res': 'Res Columns',
    'stats.latency': 'Latency',
    'stats.private': 'Private',
    'stats.possibilities': 'Possibilities',
    'feature.mosaic.title': 'MOSAIC ENGINE',
    'feature.mosaic.desc': 'Experience the power of semantic art. Our proprietary mosaic algorithm deconstructs your image and rebuilds it using custom words as living pixels. It\'s not just a filter; it\'s a textual rebirth of your visual story.',
    'feature.ascii.title': 'ASCII MAPPING',
    'feature.ascii.desc': 'Where classic computer heritage meets modern precision. We utilize a sophisticated 256-level luminance mapping system to translate every photon into the perfect character, ensuring museum-grade contrast and clarity.',
    'feature.emoji.title': 'EMOJI SYNTH',
    'feature.emoji.desc': 'The ultimate pop-art revolution. Our emoji synthesizer replaces raw data with vibrant, multi-layered icons, creating a surreal visual depth that shifts and evolves depending on your perspective.',
    'ecosystem.title': 'THE PIMX ECOSYSTEM',
    'ecosystem.desc': "PIMXMOJI is part of a larger mission. We provide the tools you need to stay connected and creative, even in the most challenging network conditions.",
    'bot.pass.title': 'PIMX PASS BOT',
    'bot.pass.badge': 'ULTIMATE CONNECTIVITY',
    'bot.pass.desc': 'Your all-in-one connectivity hub. Access a massive variety of high-speed servers and tunnels including V2Ray, OpenVPN, HA Tunnel Plus, NPV Tunnel, HTTP Custom, and HTTP Injector. Simple, complete, and always updated.',
    'bot.pass.features': 'V2Ray & VPN, 256-bit Encryption, Global Servers, Smart Routing',
    'bot.play.title': 'PIMX PLAY',
    'bot.play.badge': 'ANDROID APP HUNTER',
    'bot.play.desc': 'Direct Android app downloads inside Telegram. Skip the slow app stores and external links. Just search for an app or send a Google Play link to get the APK file instantly and securely.',
    'bot.play.features': 'Direct APK Downloads, Google Play Support, Verified Files, High Speed',
    'bot.sonic.title': 'PIMX SONIC',
    'bot.sonic.badge': 'OFFLINE MUSIC PLAYER',
    'bot.sonic.desc': 'The ultimate music companion for restricted networks. Stream and download your favorite tracks directly within Telegram without worrying about external site blocks or slow loading times.',
    'bot.sonic.features': 'Direct Streaming, High Quality Audio, Telegram Integration, No Restrictions',
    'ecosystem.detailed_desc': 'PIMX is more than just a network; it\'s a digital fortress designed for creators, developers, and freedom seekers. In an era where digital boundaries are constantly shifting, we provide a suite of intelligent tools that ensure your voice is never silenced and your creativity knows no bounds. From ultra-secure connectivity to seamless media access, every part of our ecosystem is engineered for maximum performance and absolute privacy.',
    'footer.rights': '© 2026 PIMXMOJI. ALL RIGHTS RESERVED. POWERED BY PIMX_PASS.',
    'nav.home': 'Home',
    'nav.setup': 'Setup',
    'nav.result': 'Result',
    'setup.title': 'SETUP',
    'setup.back': 'BACK',
    'setup.generate': 'GENERATE',
    'setup.generating': 'GENERATING...',
    'setup.step1.title': '1. SOURCE IMAGE',
    'setup.step1.desc': 'Upload the image you want to transform.',
    'setup.upload.click': 'Click to browse files',
    'setup.upload.drag': 'JPG, PNG or WEBP up to 10MB',
    'setup.upload.change': 'Change Image',
    'setup.step2.title': '2. CONFIGURATION',
    'setup.step2.desc': 'Customize your art generation settings.',
    'preset.matrix': 'Matrix Rain',
    'preset.cyberpunk': 'Cyberpunk',
    'preset.blueprint': 'Blueprint',
    'preset.newspaper': 'Newspaper',
    'preset.retro': 'Retro Game',
    'preset.braille': 'Braille Art',
    'preset.binary': 'Binary',
    'preset.hearts': 'Emoji Hearts',
    'preset.terminal': 'Terminal',
    'preset.gold': 'Gold Luxury',
    'preset.vaporwave': 'Vaporwave',
    'preset.sketch': 'Sketch',
    'mode.word': 'Word',
    'mode.ascii': 'ASCII',
    'mode.emoji': 'Emoji',
    'label.word': 'Word to repeat',
    'label.chars': 'Characters (Dark to Light)',
    'label.resolution': 'Resolution (Columns)',
    'label.spacing': 'Char Spacing',
    'label.brightness': 'Brightness',
    'label.contrast': 'Contrast',
    'label.saturation': 'Saturation',
    'label.fontFamily': 'Font Family',
    'label.fontWeight': 'Font Weight',
    'label.fontSize': 'Font Size',
    'label.colorize': 'Colorize Text',
    'label.textColor': 'Text',
    'label.bgColor': 'BG',
    'result.back': 'BACK TO SETUP',
    'result.title': 'RESULT',
    'result.generating.title': 'Generating Masterpiece',
    'result.generating.desc': 'Our engine is mapping pixels to characters in real-time...',
    'result.failed.title': 'Generation Failed',
    'result.failed.back': 'BACK TO SETTINGS',
    'action.download': 'DOWNLOAD IMAGE',
    'action.save': 'SAVE .TXT',
    'action.copy': 'COPY TEXT',
    'alert.upload': 'Please upload an image first!',
    'alert.copy': 'Text art copied to clipboard!',
    'alert.fail.text': 'Failed to generate text. Please try again.',
    'alert.fail.copy': 'Failed to copy text. Please try again.',
    'section.presets': 'Quick Presets',
    'section.mode': 'Art Mode & Characters',
    'section.res': 'Resolution & Spacing',
    'section.adjust': 'Image Adjustments',
    'section.typo': 'Typography & Colors',
  },
  fa: {
    'hero.badge': 'آینده هنر دیجیتال',
    'hero.title.prefix': 'پیمکس',
    'hero.title.suffix': 'موجی',
    'hero.description': 'پیکسل‌های معمولی را به شاهکارهای اسکی، موزاییک و ایموجی تبدیل کنید.',
    'hero.cta.start': 'شروع ساخت',
    'hero.cta.telegram': 'عضویت در تلگرام',
    'stats.res': 'ستون رزولوشن',
    'stats.latency': 'تأخیر',
    'stats.private': 'خصوصی',
    'stats.possibilities': 'احتمالات',
    'feature.mosaic.title': 'موتور موزاییک',
    'feature.mosaic.desc': 'قدرت هنر معنایی را تجربه کنید. الگوریتم اختصاصی ما تصویر شما را واسازی کرده و با استفاده از کلمات دلخواه به عنوان پیکسل‌های زنده، آن را دوباره می‌سازد. این فقط یک فیلتر نیست؛ تولد دوباره متنی داستان بصری شماست.',
    'feature.ascii.title': 'نگاشت اسکی',
    'feature.ascii.desc': 'جایی که میراث کلاسیک کامپیوتر با دقت مدرن ملاقات می‌کند. ما از یک سیستم پیشرفته نگاشت درخشندگی ۲۵۶ سطحی استفاده می‌کنیم تا هر فوتون را به کاراکتر ایده‌آل ترجمه کنیم و کنتراست و وضوحی در سطح موزه‌ها را تضمین کنیم.',
    'feature.emoji.title': 'سینت سایزر ایموجی',
    'feature.emoji.desc': 'انقلاب نهایی پاپ آرت. سینت سایزر ایموجی ما داده‌های خام را با آیکون‌های پر جنب و جوش و چند لایه جایگزین می‌کند و عمق بصری سورئالی ایجاد می‌کند که بسته به زاویه دید شما تغییر کرده و تکامل می‌یابد.',
    'ecosystem.title': 'اکوسیستم پیمکس',
    'ecosystem.desc': "پیمکس موجی بخشی از یک ماموریت بزرگتر است. ما ابزارهایی را در اختیار شما قرار می‌دهیم تا حتی در سخت‌ترین شرایط شبکه، متصل و خلاق بمانید.",
    'bot.pass.title': 'ربات پیمکس پس',
    'bot.pass.badge': 'اتصال نهایی',
    'bot.pass.desc': 'مرکز اتصال همه کاره شما. دسترسی به تنوع گسترده‌ای از سرورها و تانل‌های پرسرعت از جمله V2Ray، OpenVPN، HA Tunnel Plus، NPV Tunnel، HTTP Custom و HTTP Injector. ساده، کامل و همیشه به‌روز.',
    'bot.pass.features': 'V2Ray و VPN، رمزنگاری ۲۵۶ بیتی، سرورهای جهانی، مسیریابی هوشمند',
    'bot.play.title': 'پیمکس پلی',
    'bot.play.badge': 'شکارچی اپلیکیشن اندروید',
    'bot.play.desc': 'دانلود مستقیم اپلیکیشن‌های اندروید داخل تلگرام. از استورهای کند و لینک‌های خارجی عبور کنید. فقط نام برنامه را جستجو کنید یا لینک گوگل پلی بفرستید تا فایل APK را فوری و ایمن دریافت کنید.',
    'bot.play.features': 'دانلود مستقیم APK، پشتیبانی از گوگل پلی، فایل‌های تایید شده، سرعت بالا',
    'bot.sonic.title': 'پیمکس سونیک',
    'bot.sonic.badge': 'پخش‌کننده موسیقی آفلاین',
    'bot.sonic.desc': 'همراه نهایی موسیقی برای شبکه‌های محدود شده. آهنگ‌های مورد علاقه خود را مستقیماً در تلگرام پخش و دانلود کنید بدون نگرانی از مسدود شدن سایت‌های خارجی یا سرعت پایین بارگذاری.',
    'bot.sonic.features': 'پخش مستقیم، کیفیت صدای بالا، ادغام با تلگرام، بدون محدودیت',
    'ecosystem.detailed_desc': 'پیمکس فراتر از یک شبکه است؛ این یک دژ دیجیتال است که برای خالقان، توسعه‌دهندگان و جویندگان آزادی طراحی شده است. در عصری که مرزهای دیجیتال مدام در حال تغییر هستند، ما مجموعه‌ای از ابزارهای هوشمند را ارائه می‌دهیم که تضمین می‌کنند صدای شما هرگز خاموش نمی‌شود و خلاقیت شما هیچ مرزی نمی‌شناسد. از اتصال فوق امن گرفته تا دسترسی یکپارچه به رسانه‌ها، هر بخش از اکوسیستم ما برای حداکثر کارایی و حریم خصوصی مطلق مهندسی شده است.',
    'footer.rights': '© ۲۰۲۶ پیمکس موجی. تمامی حقوق محفوظ است. قدرت گرفته از پیمکس پس.',
    'nav.home': 'خانه',
    'nav.setup': 'تنظیمات',
    'nav.result': 'نتیجه',
    'setup.title': 'تنظیمات',
    'setup.back': 'بازگشت',
    'setup.generate': 'تولید',
    'setup.generating': 'در حال تولید...',
    'setup.step1.title': '۱. تصویر منبع',
    'setup.step1.desc': 'تصویری که می‌خواهید تبدیل کنید را آپلود کنید.',
    'setup.upload.click': 'برای انتخاب فایل کلیک کنید',
    'setup.upload.drag': 'JPG، PNG یا WEBP تا ۱۰ مگابایت',
    'setup.upload.change': 'تغییر تصویر',
    'setup.step2.title': '۲. پیکربندی',
    'setup.step2.desc': 'تنظیمات تولید هنر خود را سفارشی کنید.',
    'preset.matrix': 'باران ماتریکس',
    'preset.cyberpunk': 'سایبرپانک',
    'preset.blueprint': 'نقشه فنی',
    'preset.newspaper': 'روزنامه',
    'preset.retro': 'بازی رترو',
    'preset.braille': 'هنر بریل',
    'preset.binary': 'باینری',
    'preset.hearts': 'قلب‌های ایموجی',
    'preset.terminal': 'ترمینال',
    'preset.gold': 'لوکس طلایی',
    'preset.vaporwave': 'ویپورویو',
    'preset.sketch': 'طراحی',
    'mode.word': 'کلمه',
    'mode.ascii': 'اسکی',
    'mode.emoji': 'ایموجی',
    'label.word': 'کلمه برای تکرار',
    'label.chars': 'کاراکترها (تیره به روشن)',
    'label.resolution': 'رزولوشن (ستون‌ها)',
    'label.spacing': 'فاصله کاراکتر',
    'label.brightness': 'روشنایی',
    'label.contrast': 'کنتراست',
    'label.saturation': 'اشباع رنگ',
    'label.fontFamily': 'خانواده فونت',
    'label.fontWeight': 'وزن فونت',
    'label.fontSize': 'اندازه قلم',
    'label.colorize': 'رنگی کردن متن',
    'label.textColor': 'متن',
    'label.bgColor': 'پس‌زمینه',
    'result.back': 'بازگشت به تنظیمات',
    'result.title': 'نتیجه',
    'result.generating.title': 'تولید شاهکار',
    'result.generating.desc': 'موتور ما در حال نگاشت پیکسل‌ها به کاراکترها به صورت بلادرنگ است...',
    'result.failed.title': 'تولید ناموفق بود',
    'result.failed.back': 'بازگشت به تنظیمات',
    'action.download': 'دانلود تصویر',
    'action.save': 'ذخیره .TXT',
    'action.copy': 'کپی متن',
    'alert.upload': 'لطفاً ابتدا یک تصویر آپلود کنید!',
    'alert.copy': 'هنر متنی در کلیپ‌بورد کپی شد!',
    'alert.fail.text': 'تولید متن ناموفق بود. لطفاً دوباره تلاش کنید.',
    'alert.fail.copy': 'کپی متن ناموفق بود. لطفاً دوباره تلاش کنید.',
    'section.presets': 'پریست‌های سریع',
    'section.mode': 'حالت هنر و کاراکترها',
    'section.res': 'رزولوشن و فاصله',
    'section.adjust': 'تنظیمات تصویر',
    'section.typo': 'تایپوگرافی و رنگ‌ها',
  }
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark initially to match current style
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLanguage = localStorage.getItem('language') as Language;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply language
    const root = window.document.documentElement;
    root.lang = language;
    root.dir = language === 'fa' ? 'rtl' : 'ltr';
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fa' : 'en');
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, language, toggleTheme, toggleLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
