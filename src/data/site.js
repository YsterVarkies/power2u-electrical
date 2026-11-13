import media from './media.json';

// media.json stores root-relative paths ("/media/..."); prefix them with the deploy base
// so the site also works from a sub-path such as GitHub Pages (/repo-name/).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const withBase = value => (typeof value === 'string' && value.startsWith('/media/') ? BASE + value : value);

export const photos = Object.fromEntries(
  Object.entries(media.photos).map(([slug, p]) => [slug, { ...p, src: withBase(p.src), src2x: withBase(p.src2x) }])
);
export const heroVideo = Object.fromEntries(Object.entries(media.video).map(([k, v]) => [k, withBase(v)]));

/** Everything below comes from the Power2U business card. */
export const BUSINESS = {
  name: 'Power2U Electrical',
  legalName: 'Power2U Electrical (Pty) Ltd',
  contact: 'Roelof v/d Westhuizen',
  phoneDisplay: '083 620 3628',
  phoneHref: 'tel:+27836203628',
  whatsapp: '27836203628',
  email: 'Power2Uelectrical@gmail.com',
  website: 'Power2Uelectrical.co.za',
  address: ['4 Wenakker Street', 'De Land Estate', 'Potchefstroom'],
  mapsHref:
    'https://www.google.com/maps/search/?api=1&query=4%20Wenakker%20Street%2C%20De%20Land%20Estate%2C%20Potchefstroom',
  reg: '2023/197741/07',
  vat: '4790317673',
  ecb: 'E17339',
  ecbRegion: 'NW000380',
  experience: 30
};

export const whatsappHref = (text = '') =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const NAV = [
  { id: 'services', label: 'Services' },
  { id: 'backup', label: 'Solar & backup' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' }
];

export const SERVICES = [
  {
    key: 'solar',
    word: 'SOLAR',
    short: 'Solar PV',
    title: 'Solar PV installations',
    blurb:
      'Roof-mounted and carport solar arrays, designed around your roof, your usage and your budget, and installed legally, by the book.',
    points: ['Roof & carport arrays', 'Grid-tied or hybrid', 'Certified & compliant'],
    tint: '#ffb547',
    photo: 'rooftop-array',
    focus: '62% 50%'
  },
  {
    key: 'backup',
    word: 'BACKUP',
    short: 'Battery backup',
    title: 'Battery backup & inverters',
    blurb:
      'Hybrid inverters and lithium storage that take over when the grid drops, so the lights, Wi-Fi and fridge keep running.',
    points: ['Hybrid inverters', 'Lithium battery storage', 'Automatic changeover'],
    tint: '#8ef04c',
    photo: 'dyness-wall',
    focus: '50% 45%'
  },
  {
    key: 'install',
    word: 'INSTALL',
    short: 'Installations',
    title: 'Electrical installations',
    blurb:
      'New wiring, distribution boards, lighting and plug points for homes, extensions and businesses. Neat, safe and up to standard.',
    points: ['Distribution boards', 'Lighting & plug points', 'New builds & alterations'],
    tint: '#5ad7ff',
    photo: 'twin-inverter-rack',
    focus: '50% 40%'
  },
  {
    key: 'coc',
    word: 'COC',
    short: 'COC certificates',
    title: 'Certificates of Compliance',
    blurb:
      'Electrical COCs for property transfers, new installations and peace of mind: inspected, tested and issued by a registered electrician.',
    points: ['Property transfers', 'New installations', 'Inspection & testing'],
    tint: '#f1e6cf',
    photo: 'solis-db-board',
    focus: '50% 30%'
  },
  {
    key: 'upgrade',
    word: 'UPGRADE',
    short: 'Upgrades',
    title: 'Upgrades',
    blurb:
      'Bring an older installation up to date with DB board upgrades, surge protection, earth leakage and dedicated circuits for new appliances.',
    points: ['DB board upgrades', 'Surge protection', 'Dedicated circuits'],
    tint: '#b49cff',
    photo: 'workshop-backup',
    focus: '62% 50%'
  },
  {
    key: 'repair',
    word: 'REPAIR',
    short: 'Repairs',
    title: 'Repairs & maintenance',
    blurb:
      'Fault finding, tripping breakers and routine maintenance, including check-ups on existing solar and backup systems.',
    points: ['Fault finding', 'Tripping breakers', 'System check-ups'],
    tint: '#ff6f61',
    photo: 'onsite-roof',
    focus: '30% 40%'
  }
];

export const PROJECTS = [
  {
    photo: 'solis-db-board',
    name: 'Solis',
    tag: 'Hybrid',
    title: 'Solis hybrid, wall-mounted',
    summary:
      'A compact hybrid backup system: inverter, battery and protection, all mounted and labelled on one wall.',
    specs: [
      ['Inverter', 'Solis hybrid'],
      ['Storage', 'Lithium battery'],
      ['Protection', 'Dedicated DB boards & isolators'],
      ['Scope', 'Supply, install & coaching']
    ],
    focus: '50% 30%'
  },
  {
    photo: 'dyness-wall',
    name: 'Dyness',
    tag: 'Triple stack',
    title: 'Dyness inverter & three-module stack',
    summary:
      'Three wall-mounted lithium modules beside a Dyness hybrid inverter, with a DC isolator and a clean cable run.',
    specs: [
      ['Inverter', 'Dyness hybrid'],
      ['Storage', '3 × wall-mounted lithium modules'],
      ['Protection', 'DC isolator & AC board'],
      ['Scope', 'Supply, install & coaching']
    ],
    focus: '50% 50%'
  },
  {
    photo: 'inverter-bank',
    name: 'Synapse',
    tag: 'Six-inverter bank',
    title: 'Six-inverter Synapse bank',
    summary:
      'A larger installation: six Synapse inverters on a common cable tray, fed by a Pylontech rack-mounted lithium stack.',
    specs: [
      ['Inverters', '6 × Synapse'],
      ['Storage', 'Pylontech UP5000 rack'],
      ['Cabling', 'Common trunking & tray'],
      ['Scope', 'Supply & install']
    ],
    focus: '35% 50%'
  },
  {
    photo: 'twin-inverter-rack',
    name: 'Twin',
    tag: 'Rack & dual inverter',
    title: 'Dual inverters with rack storage',
    summary:
      'Two hybrid inverters with a rack-mounted lithium bank on castors, plus surge and isolation boards.',
    specs: [
      ['Inverters', '2 × hybrid'],
      ['Storage', 'Rack-mounted lithium'],
      ['Protection', 'AC/DC boards & surge'],
      ['Scope', 'Supply, install & coaching']
    ],
    focus: '50% 45%'
  },
  {
    photo: 'rooftop-array',
    name: 'Rooftop',
    tag: 'PV array',
    title: 'Rooftop solar on tiles',
    summary:
      'Two roof-mounted arrays on a tiled roof, placed for good sun across the day and kept neat at the ridge.',
    specs: [
      ['Mounting', 'Tiled-roof rails'],
      ['Layout', 'Two arrays'],
      ['Use', 'Daytime generation & charging'],
      ['Scope', 'Supply & install']
    ],
    focus: '64% 55%'
  },
  {
    photo: 'carport-garden',
    name: 'Carport',
    tag: 'Solar carport',
    title: 'Solar carport',
    summary:
      'Panels on a steel carport frame: shade for the cars and generation without touching the roof.',
    specs: [
      ['Structure', 'Steel carport frame'],
      ['Mounting', 'Integrated PV roof'],
      ['Use', 'Shade & generation'],
      ['Scope', 'Supply & install']
    ],
    focus: '50% 40%'
  }
];

export const STORY = [
  {
    time: '06:00',
    title: 'The sun clocks in.',
    text: 'Your panels start generating at first light, covering daytime usage before you have made coffee.'
  },
  {
    time: '12:30',
    title: 'Surplus gets stored.',
    text: 'Extra energy charges your lithium batteries instead of going to waste.'
  },
  {
    time: '18:00',
    title: 'The grid goes down.',
    text: 'Load shedding hits the street. Your inverter switches to battery automatically, in milliseconds.'
  },
  {
    time: '18:01',
    title: 'Your lights stay on.',
    text: 'Lights, Wi-Fi, TV and the fridge keep running. Most of the time you will not even notice.'
  },
  {
    time: '22:00',
    title: 'Sized to fit you.',
    text: 'Every system is designed after a free on-site assessment, to fit your needs and your budget.'
  }
];

export const STEPS = [
  {
    title: 'Free on-site assessment',
    text: 'We come out, look at your property and your usage, and listen to what you actually need powered.'
  },
  {
    title: 'A system sized to your budget',
    text: 'You get a clear recommendation and quote that fits your needs to your budget. No overselling.'
  },
  {
    title: 'Legal, certified installation',
    text: 'Neat, compliant workmanship by a qualified electrician, with a Certificate of Compliance where required.'
  },
  {
    title: 'Free product coaching',
    text: 'After installation we show you how to use and monitor your system, so you get the most out of it.'
  }
];

export const BRANDS = ['ESENER', 'PYLONTECH', 'SOLIS', 'SYNAPSE', 'WECO', 'DYNESS'];
