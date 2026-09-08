export const WORDS: readonly string[] = (
  'about above across after again against almost alone along already although always among ' +
  'animal answer appear around arrive because become before begin behind believe beside better ' +
  'between beyond bloom bottle branch bright bring bridge brother build butter candle careful ' +
  'castle catch center certain change chance cheese circle clear clever climb cloud color ' +
  'common corner cotton country cousin cover create curious dance danger decide deliver desert ' +
  'design dinner direct distant doctor double dream during early earth easy either empty enough ' +
  'evening every example except expect family famous father feather field figure filter finger ' +
  'finish flower follow forest forget forward friend garden gather gentle giant glass golden ' +
  'grass ground guess happen harbor hazel heavy hidden honey horizon hundred hungry island ' +
  'jacket journey jungle kettle kitten ladder lantern laugh lemon letter little lucky machine ' +
  'magic marble meadow middle minute mirror moment morning mother mountain music nature needle ' +
  'nothing number ocean orange orchard paper parent pencil people pepper picture planet plenty ' +
  'pocket poet pretty purple puzzle quiet rabbit rather reason remember ribbon river rocket ' +
  'saddle season secret shadow silver simple sister sleep smile soft spring square stone story ' +
  'street summer sunny table teacher thunder ticket travel turtle under valley velvet village ' +
  'violet wander water window winter wonder yellow yesterday'
).split(' ')

export const URLS: readonly string[] = [
  'ad-tracker.example', 'ads.spamhaus.test', 'bad-download.example', 'banner-farm.example',
  'click-bait.example', 'coinminer.example', 'cookie-sync.example', 'creepy-pixel.example',
  'dark-pattern.example', 'data-broker.example', 'drive-by.example', 'evil.example',
  'fake-login.example', 'fingerprint.example', 'free-gift-cards.example', 'keylogger.example',
  'malware-cdn.example', 'notification-spam.example', 'phish.example', 'popunder.example',
  'ransom.example', 'redirect-loop.example', 'scam-support.example', 'shady-vpn.example',
  'sketchy-ext.example', 'spyware.example', 'stalkerware.example', 'trojan-host.example',
  'typosquat.example', 'urgent-update.example', 'win-a-prize.example', 'zero-day.example',
]

export interface Preset {
  id: string
  label: string
  blurb: string
  m: number
  k: number
  kind: 'standard' | 'counting'
  items: readonly string[]
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'spell',
    label: 'Spell-checker',
    blurb: '205 dictionary words in 1,024 bits — the classic use.',
    m: 1024,
    k: 4,
    kind: 'standard',
    items: WORDS,
  },
  {
    id: 'urls',
    label: 'URL blocklist',
    blurb: '32 hostnames in 512 bits with a deliberately low k.',
    m: 512,
    k: 3,
    kind: 'standard',
    items: URLS,
  },
  {
    id: 'tiny',
    label: 'Tiny m',
    blurb: '40 words crammed into 64 bits — collisions everywhere.',
    m: 64,
    k: 3,
    kind: 'standard',
    items: WORDS.slice(0, 40),
  },
]
