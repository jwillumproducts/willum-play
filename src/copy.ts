export const BRAND = 'Willum Play'

export const LOCALES = ['da', 'en', 'es', 'de', 'zh', 'hi', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

export interface Copy {
  htmlLang: string
  ogLocale: string
  seoTitle: string
  seoAboutTitle: string
  seoDescription: string
  deviceLead: string
  computer: string
  keyboard: string
  chosenKeyboard: string
  controller: string
  padOr: string
  chosen: string
  chosenNamed: string
  tablet: string
  touch: string
  chosenTouch: string
  later: string
  credit: string
  turnPhone: string
  turnPhoneHint: string
  about: string
  intro: [string, string, string]
  chooseDevice: string
  chooseDeviceNote: string
  chooseLevel: string
  practicePad: string
  practiceKey: string
  levelWord: string
  lastPicked: string
  side: string
  top: string
  switchDevice: string
  settings: string
  language: string
  soundOn: string
  soundOff: string
  pause: string
  resume: string
  switchLevel: string
  cancel: string
  padHelp: string
  padLogo: string
  padUnread: string
  padWait: string
  connected: string
  noPad: string
  hen: string
  car: string
  henLevels: [string, string, string, string]
  carLevels: [string, string, string, string]
  left: string
  right: string
  up: string
  down: string
  space: string
  enter: string
  cross: string
  circle: string
  controllerOf: string
}

export const NATIVE_NAME: Record<Locale, string> = {
  da: 'Dansk',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  zh: '中文',
  hi: 'हिन्दी',
  fr: 'Français',
}

const da: Copy = {
  htmlLang: 'da',
  ogLocale: 'da_DK',
  seoTitle: 'Willum Play – rolige spil for børn',
  seoAboutTitle: 'Om Willum Play',
  seoDescription:
    'Willum Play er små rolige spil i browseren, hvor børn øver tastatur, controller eller touch én knap ad gangen. Ingen konto, tid eller nederlag.',
  deviceLead: 'Hvad skal I spille med?',
  computer: 'Computer',
  keyboard: 'Tastatur',
  chosenKeyboard: 'Valgt · tastatur',
  controller: 'Controller',
  padOr: 'PlayStation DualSense, Xbox og lignende',
  chosen: 'Valgt',
  chosenNamed: 'Valgt · {name}',
  tablet: 'Tablet eller mobil',
  touch: 'Touchknapper',
  chosenTouch: 'Valgt · touch',
  later: 'Kommer senere',
  credit: 'Et JWillum Kids-spil',
  turnPhone: 'Drej telefonen',
  turnPhoneHint: 'Vend telefonen på siden for at spille',
  about: 'Om Willum Play',
  intro: [
    'Willum Play er rolige spil til små børn, der øver de første knapper på tastatur, controller eller tablet.',
    'Forældrene vælger enhed og bane. Barnet øver én ny knap ad gangen og må blive ved, så længe det har lyst. Der er ingen tid, point eller nederlag.',
    'Siden er lavet, så de første skridt kan ske hjemme i browseren, uden at barnet skal skynde sig eller oprette en konto.',
  ],
  chooseDevice: 'Vælg enhed',
  chooseDeviceNote: 'Computer, controller eller tablet',
  chooseLevel: 'Vælg en bane',
  practicePad: 'Barnet øver den nye knap og kan blive ved.',
  practiceKey: 'Barnet øver den nye tast og kan blive ved.',
  levelWord: 'Bane',
  lastPicked: 'sidst valgt',
  side: 'Set fra siden',
  top: 'Set ovenfra',
  switchDevice: 'Skift enhed',
  settings: 'Indstillinger',
  language: 'Sprog',
  soundOn: 'Slå lyd til',
  soundOff: 'Slå lyd fra',
  pause: 'Pause',
  resume: 'Leg videre',
  switchLevel: 'Skift bane',
  cancel: 'Annuller',
  padHelp: 'Tilslut en PlayStation- eller Xbox-controller med USB-kabel eller Bluetooth. Begge måder virker ens.',
  padLogo: 'Tryk på logoet i midten, når den er sat til.',
  padUnread: 'Controlleren blev fundet, men knapperne kan ikke læses.',
  padWait: 'Tryk på logoet i midten. Hvis der ikke sker noget, så slå Xbox Game Bar fra for den knap.',
  connected: '{name} tilsluttet',
  noPad: 'Ingen controller tilsluttet',
  hen: 'Hønen',
  car: 'Bilen',
  henLevels: ['Gå', 'Hop', 'Fire retninger', 'Handling'],
  carLevels: ['Kør', 'Brems', 'Kør rundt', 'Dyt'],
  left: 'venstre',
  right: 'højre',
  up: 'op',
  down: 'ned',
  space: 'mellemrum',
  enter: 'enter',
  cross: 'kryds',
  circle: 'cirkel',
  controllerOf: '{name}-controller',
}

const en: Copy = {
  htmlLang: 'en',
  ogLocale: 'en_GB',
  seoTitle: 'Willum Play – calm games for children',
  seoAboutTitle: 'About Willum Play',
  seoDescription:
    'Willum Play is a set of calm browser games where children practise a keyboard, controller, or touch buttons, one button at a time. No account, timer, or failure.',
  deviceLead: 'What will you play with?',
  computer: 'Computer',
  keyboard: 'Keyboard',
  chosenKeyboard: 'Chosen · keyboard',
  controller: 'Controller',
  padOr: 'PlayStation DualSense, Xbox and similar',
  chosen: 'Chosen',
  chosenNamed: 'Chosen · {name}',
  tablet: 'Tablet or phone',
  touch: 'Touch buttons',
  chosenTouch: 'Chosen · touch',
  later: 'Coming later',
  credit: 'A JWillum Kids game',
  turnPhone: 'Turn the phone',
  turnPhoneHint: 'Turn the phone on its side to play',
  about: 'About Willum Play',
  intro: [
    'Willum Play is a set of calm games for young children who are learning the first buttons on a keyboard, a controller, or a tablet.',
    'Parents choose the device and the level. The child practises one new button at a time and can stay as long as they like. There is no timer, score, or failure.',
    'The site is made so those first steps can happen at home in the browser, without rushing or creating an account.',
  ],
  chooseDevice: 'Choose a device',
  chooseDeviceNote: 'Computer, controller, or tablet',
  chooseLevel: 'Choose a level',
  practicePad: 'The child practises the new button and can keep going.',
  practiceKey: 'The child practises the new key and can keep going.',
  levelWord: 'Level',
  lastPicked: 'last chosen',
  side: 'Side view',
  top: 'Top view',
  switchDevice: 'Change device',
  settings: 'Settings',
  language: 'Language',
  soundOn: 'Turn sound on',
  soundOff: 'Turn sound off',
  pause: 'Pause',
  resume: 'Keep playing',
  switchLevel: 'Change level',
  cancel: 'Cancel',
  padHelp: 'Connect a PlayStation or Xbox controller with a USB cable or Bluetooth. Both ways work the same.',
  padLogo: 'Press the logo in the middle once it is connected.',
  padUnread: 'The controller was found, but the buttons cannot be read.',
  padWait: 'Press the logo in the middle. If nothing happens, turn off Xbox Game Bar for that button.',
  connected: '{name} connected',
  noPad: 'No controller connected',
  hen: 'The hen',
  car: 'The car',
  henLevels: ['Walk', 'Jump', 'Four directions', 'Action'],
  carLevels: ['Drive', 'Brake', 'Drive around', 'Honk'],
  left: 'left',
  right: 'right',
  up: 'up',
  down: 'down',
  space: 'space',
  enter: 'enter',
  cross: 'cross',
  circle: 'circle',
  controllerOf: '{name} controller',
}

const es: Copy = {
  htmlLang: 'es',
  ogLocale: 'es_ES',
  seoTitle: 'Willum Play – juegos tranquilos para niños',
  seoAboutTitle: 'Sobre Willum Play',
  seoDescription:
    'Willum Play son juegos tranquilos en el navegador donde los niños practican el teclado o el mando, un botón cada vez. Sin cuenta, tiempo ni fracaso.',
  deviceLead: '¿Con qué vais a jugar?',
  computer: 'Ordenador',
  keyboard: 'Teclado',
  chosenKeyboard: 'Elegido · teclado',
  controller: 'Mando',
  padOr: 'PlayStation DualSense, Xbox y similares',
  chosen: 'Elegido',
  chosenNamed: 'Elegido · {name}',
  tablet: 'Tableta o móvil',
  touch: 'Botones táctiles',
  chosenTouch: 'Elegido · tacto',
  later: 'Más adelante',
  credit: 'Un juego de JWillum Kids',
  turnPhone: 'Gira el teléfono',
  turnPhoneHint: 'Pon el teléfono de lado para jugar',
  about: 'Sobre Willum Play',
  intro: [
    'Willum Play son juegos tranquilos para niños pequeños que practican los primeros botones del teclado o del mando.',
    'Los padres eligen el aparato y el recorrido. El niño practica un botón nuevo cada vez y puede seguir todo el tiempo que quiera. No hay tiempo, puntos ni fracaso.',
    'La página está hecha para que esos primeros pasos ocurran en casa, en el navegador, sin prisas y sin crear una cuenta.',
  ],
  chooseDevice: 'Elegir aparato',
  chooseDeviceNote: 'Ordenador, mando o tableta',
  chooseLevel: 'Elegir un recorrido',
  practicePad: 'El niño practica el botón nuevo y puede seguir.',
  practiceKey: 'El niño practica la tecla nueva y puede seguir.',
  levelWord: 'Recorrido',
  lastPicked: 'último elegido',
  side: 'Visto de lado',
  top: 'Visto desde arriba',
  switchDevice: 'Cambiar aparato',
  settings: 'Ajustes',
  language: 'Idioma',
  soundOn: 'Activar el sonido',
  soundOff: 'Quitar el sonido',
  pause: 'Pausa',
  resume: 'Seguir jugando',
  switchLevel: 'Cambiar de recorrido',
  cancel: 'Cancelar',
  padHelp: 'Conecta un mando de PlayStation o Xbox con cable USB o Bluetooth. Las dos formas funcionan igual.',
  padLogo: 'Pulsa el logo del centro cuando esté conectado.',
  padUnread: 'Se encontró el mando, pero no se pueden leer los botones.',
  padWait: 'Pulsa el logo del centro. Si no pasa nada, desactiva Xbox Game Bar para ese botón.',
  connected: '{name} conectado',
  noPad: 'Ningún mando conectado',
  hen: 'La gallina',
  car: 'El coche',
  henLevels: ['Caminar', 'Saltar', 'Cuatro direcciones', 'Acción'],
  carLevels: ['Conducir', 'Frenar', 'Dar vueltas', 'Pitar'],
  left: 'izquierda',
  right: 'derecha',
  up: 'arriba',
  down: 'abajo',
  space: 'espacio',
  enter: 'enter',
  cross: 'cruz',
  circle: 'círculo',
  controllerOf: 'mando {name}',
}

const de: Copy = {
  htmlLang: 'de',
  ogLocale: 'de_DE',
  seoTitle: 'Willum Play – ruhige Spiele für Kinder',
  seoAboutTitle: 'Über Willum Play',
  seoDescription:
    'Willum Play sind ruhige Browserspiele, in denen Kinder Tastatur oder Controller üben, eine Taste nach der anderen. Kein Konto, keine Zeit, kein Verlieren.',
  deviceLead: 'Womit spielt ihr?',
  computer: 'Computer',
  keyboard: 'Tastatur',
  chosenKeyboard: 'Gewählt · Tastatur',
  controller: 'Controller',
  padOr: 'PlayStation DualSense, Xbox und ähnliche',
  chosen: 'Gewählt',
  chosenNamed: 'Gewählt · {name}',
  tablet: 'Tablet oder Handy',
  touch: 'Touch-Tasten',
  chosenTouch: 'Gewählt · Touch',
  later: 'Kommt später',
  credit: 'Ein JWillum Kids-Spiel',
  turnPhone: 'Dreht das Handy',
  turnPhoneHint: 'Legt das Handy auf die Seite zum Spielen',
  about: 'Über Willum Play',
  intro: [
    'Willum Play sind ruhige Spiele für kleine Kinder, die die ersten Tasten auf Tastatur oder Controller üben.',
    'Die Eltern wählen Gerät und Bahn. Das Kind übt eine neue Taste nach der anderen und darf so lange bleiben, wie es mag. Es gibt keine Zeit, Punkte oder Niederlage.',
    'Die Seite ist dafür gemacht, dass diese ersten Schritte zu Hause im Browser passieren, ohne Eile und ohne Konto.',
  ],
  chooseDevice: 'Gerät wählen',
  chooseDeviceNote: 'Computer, Controller oder Tablet',
  chooseLevel: 'Bahn wählen',
  practicePad: 'Das Kind übt den neuen Knopf und darf weitermachen.',
  practiceKey: 'Das Kind übt die neue Taste und darf weitermachen.',
  levelWord: 'Bahn',
  lastPicked: 'zuletzt gewählt',
  side: 'Von der Seite',
  top: 'Von oben',
  switchDevice: 'Gerät wechseln',
  settings: 'Einstellungen',
  language: 'Sprache',
  soundOn: 'Ton an',
  soundOff: 'Ton aus',
  pause: 'Pause',
  resume: 'Weiter spielen',
  switchLevel: 'Bahn wechseln',
  cancel: 'Abbrechen',
  padHelp: 'Schließt einen PlayStation- oder Xbox-Controller mit USB-Kabel oder Bluetooth an. Beides funktioniert gleich.',
  padLogo: 'Drückt das Logo in der Mitte, wenn er angeschlossen ist.',
  padUnread: 'Der Controller wurde gefunden, aber die Tasten können nicht gelesen werden.',
  padWait: 'Drückt das Logo in der Mitte. Wenn nichts passiert, schaltet Xbox Game Bar für diese Taste aus.',
  connected: '{name} verbunden',
  noPad: 'Kein Controller verbunden',
  hen: 'Das Huhn',
  car: 'Das Auto',
  henLevels: ['Gehen', 'Hüpfen', 'Vier Richtungen', 'Aktion'],
  carLevels: ['Fahren', 'Bremsen', 'Herumfahren', 'Hupen'],
  left: 'links',
  right: 'rechts',
  up: 'hoch',
  down: 'runter',
  space: 'Leertaste',
  enter: 'Enter',
  cross: 'Kreuz',
  circle: 'Kreis',
  controllerOf: '{name}-Controller',
}

const zh: Copy = {
  htmlLang: 'zh-Hans',
  ogLocale: 'zh_CN',
  seoTitle: 'Willum Play：给孩子的安静小游戏',
  seoAboutTitle: '关于 Willum Play',
  seoDescription: 'Willum Play 是浏览器里的安静小游戏。孩子一次练习一个键盘或手柄按钮。不用账号，没有计时，也不会失败。',
  deviceLead: '用什么来玩？',
  computer: '电脑',
  keyboard: '键盘',
  chosenKeyboard: '已选 · 键盘',
  controller: '手柄',
  padOr: 'PlayStation DualSense、Xbox 等',
  chosen: '已选',
  chosenNamed: '已选 · {name}',
  tablet: '平板或手机',
  touch: '触摸按键',
  chosenTouch: '已选 · 触摸',
  later: '以后再做',
  credit: 'JWillum Kids 的游戏',
  turnPhone: '转动手机',
  turnPhoneHint: '把手机横过来再玩',
  about: '关于 Willum Play',
  intro: [
    'Willum Play 是给小朋友的安静小游戏，用来练习键盘或手柄上的第一批按钮。',
    '家长选择设备和关卡。孩子一次练习一个新按钮，想玩多久都可以。没有计时、分数或失败。',
    '这个网站是为了让这第一步在家用浏览器里完成，不用着急，也不用注册账号。',
  ],
  chooseDevice: '选择设备',
  chooseDeviceNote: '电脑、手柄或平板',
  chooseLevel: '选择关卡',
  practicePad: '孩子练习新按钮，可以一直玩。',
  practiceKey: '孩子练习新按键，可以一直玩。',
  levelWord: '关卡',
  lastPicked: '上次选的',
  side: '从侧面看',
  top: '从上面看',
  switchDevice: '更换设备',
  settings: '设置',
  language: '语言',
  soundOn: '打开声音',
  soundOff: '关闭声音',
  pause: '暂停',
  resume: '继续玩',
  switchLevel: '更换关卡',
  cancel: '取消',
  padHelp: '用 USB 线或蓝牙连接 PlayStation 或 Xbox 手柄。两种方式是一样的。',
  padLogo: '连上之后，按中间的标志按钮。',
  padUnread: '找到了手柄，但读不到按钮。',
  padWait: '按中间的标志按钮。如果没有反应，请为这个按钮关闭 Xbox Game Bar。',
  connected: '已连接 {name}',
  noPad: '没有连接手柄',
  hen: '母鸡',
  car: '小汽车',
  henLevels: ['走', '跳', '四个方向', '动作'],
  carLevels: ['开', '刹车', '绕着开', '按喇叭'],
  left: '左',
  right: '右',
  up: '上',
  down: '下',
  space: '空格',
  enter: 'Enter',
  cross: '叉',
  circle: '圆圈',
  controllerOf: '{name} 手柄',
}

const hi: Copy = {
  htmlLang: 'hi',
  ogLocale: 'hi_IN',
  seoTitle: 'Willum Play – बच्चों के लिए शांत खेल',
  seoAboutTitle: 'Willum Play के बारे में',
  seoDescription:
    'Willum Play ब्राउज़र के शांत खेल हैं, जिनमें बच्चे कीबोर्ड या कंट्रोलर का एक-एक बटन अभ्यास करते हैं। न खाता, न समय, न हार।',
  deviceLead: 'किससे खेलोगे?',
  computer: 'कंप्यूटर',
  keyboard: 'कीबोर्ड',
  chosenKeyboard: 'चुना · कीबोर्ड',
  controller: 'कंट्रोलर',
  padOr: 'PlayStation DualSense, Xbox और ऐसे ही',
  chosen: 'चुना',
  chosenNamed: 'चुना · {name}',
  tablet: 'टैबलेट या फ़ोन',
  touch: 'टच बटन',
  chosenTouch: 'चुना · टच',
  later: 'बाद में',
  credit: 'JWillum Kids का खेल',
  turnPhone: 'फ़ोन घुमाएँ',
  turnPhoneHint: 'खेलने के लिए फ़ोन को बगल में करें',
  about: 'Willum Play के बारे में',
  intro: [
    'Willum Play छोटे बच्चों के लिए शांत खेल हैं, जो कीबोर्ड या कंट्रोलर के पहले बटन अभ्यास करते हैं।',
    'माता-पिता डिवाइस और स्तर चुनते हैं। बच्चा एक बार में एक नया बटन अभ्यास करता है और जितनी देर चाहे रह सकता है। न समय है, न अंक, न हार।',
    'यह साइट इसलिए बनी है कि यह पहला कदम घर पर ब्राउज़र में हो, बिना जल्दबाज़ी और बिना खाता बनाए।',
  ],
  chooseDevice: 'डिवाइस चुनें',
  chooseDeviceNote: 'कंप्यूटर, कंट्रोलर या टैबलेट',
  chooseLevel: 'स्तर चुनें',
  practicePad: 'बच्चा नया बटन अभ्यास करता है और खेलता रह सकता है।',
  practiceKey: 'बच्चा नई कुंजी अभ्यास करता है और खेलता रह सकता है।',
  levelWord: 'स्तर',
  lastPicked: 'पिछली बार',
  side: 'बगल से',
  top: 'ऊपर से',
  switchDevice: 'डिवाइस बदलें',
  settings: 'सेटिंग',
  language: 'भाषा',
  soundOn: 'आवाज़ चालू',
  soundOff: 'आवाज़ बंद',
  pause: 'रोकें',
  resume: 'आगे खेलें',
  switchLevel: 'स्तर बदलें',
  cancel: 'रद्द करें',
  padHelp: 'PlayStation या Xbox कंट्रोलर को USB तार या Bluetooth से जोड़ें। दोनों तरीके एक जैसे हैं।',
  padLogo: 'जुड़ने के बाद बीच वाला लोगो दबाएँ।',
  padUnread: 'कंट्रोलर मिल गया, पर बटन पढ़े नहीं जा सके।',
  padWait: 'बीच वाला लोगो दबाएँ। अगर कुछ न हो, तो उस बटन के लिए Xbox Game Bar बंद करें।',
  connected: '{name} जुड़ा है',
  noPad: 'कोई कंट्रोलर नहीं जुड़ा',
  hen: 'मुर्गी',
  car: 'कार',
  henLevels: ['चलो', 'कूदो', 'चार दिशाएँ', 'काम'],
  carLevels: ['चलाओ', 'ब्रेक', 'घूमो', 'हॉर्न'],
  left: 'बाएँ',
  right: 'दाएँ',
  up: 'ऊपर',
  down: 'नीचे',
  space: 'स्पेस',
  enter: 'Enter',
  cross: 'क्रॉस',
  circle: 'गोला',
  controllerOf: '{name} कंट्रोलर',
}

const fr: Copy = {
  htmlLang: 'fr',
  ogLocale: 'fr_FR',
  seoTitle: 'Willum Play – jeux calmes pour enfants',
  seoAboutTitle: 'À propos de Willum Play',
  seoDescription:
    'Willum Play, ce sont de petits jeux calmes dans le navigateur. L’enfant s’exerce au clavier ou à la manette, un bouton à la fois. Pas de compte, de temps, ni d’échec.',
  deviceLead: 'Avec quoi jouez-vous ?',
  computer: 'Ordinateur',
  keyboard: 'Clavier',
  chosenKeyboard: 'Choisi · clavier',
  controller: 'Manette',
  padOr: 'PlayStation DualSense, Xbox et similaires',
  chosen: 'Choisi',
  chosenNamed: 'Choisi · {name}',
  tablet: 'Tablette ou téléphone',
  touch: 'Boutons tactiles',
  chosenTouch: 'Choisi · tactile',
  later: 'Plus tard',
  credit: 'Un jeu JWillum Kids',
  turnPhone: 'Tournez le téléphone',
  turnPhoneHint: 'Mettez le téléphone sur le côté pour jouer',
  about: 'À propos de Willum Play',
  intro: [
    'Willum Play, ce sont des jeux calmes pour les jeunes enfants qui apprennent les premiers boutons du clavier ou de la manette.',
    'Les parents choisissent l’appareil et le parcours. L’enfant s’exerce à un nouveau bouton à la fois et peut rester aussi longtemps qu’il veut. Il n’y a pas de temps, de points, ni d’échec.',
    'Le site est fait pour que ces premiers pas se passent à la maison, dans le navigateur, sans se presser et sans créer de compte.',
  ],
  chooseDevice: 'Choisir l’appareil',
  chooseDeviceNote: 'Ordinateur, manette ou tablette',
  chooseLevel: 'Choisir un parcours',
  practicePad: 'L’enfant s’exerce au nouveau bouton et peut continuer.',
  practiceKey: 'L’enfant s’exerce à la nouvelle touche et peut continuer.',
  levelWord: 'Parcours',
  lastPicked: 'dernier choix',
  side: 'Vu de côté',
  top: 'Vu de dessus',
  switchDevice: 'Changer d’appareil',
  settings: 'Réglages',
  language: 'Langue',
  soundOn: 'Activer le son',
  soundOff: 'Couper le son',
  pause: 'Pause',
  resume: 'Continuer',
  switchLevel: 'Changer de parcours',
  cancel: 'Annuler',
  padHelp: 'Branchez une manette PlayStation ou Xbox avec un câble USB ou en Bluetooth. Les deux façons marchent pareil.',
  padLogo: 'Appuyez sur le logo au milieu quand elle est branchée.',
  padUnread: 'La manette a été trouvée, mais les boutons ne peuvent pas être lus.',
  padWait: 'Appuyez sur le logo au milieu. Si rien ne se passe, désactivez Xbox Game Bar pour ce bouton.',
  connected: '{name} connecté',
  noPad: 'Aucune manette connectée',
  hen: 'La poule',
  car: 'La voiture',
  henLevels: ['Marcher', 'Sauter', 'Quatre directions', 'Action'],
  carLevels: ['Rouler', 'Freiner', 'Tourner', 'Klaxonner'],
  left: 'gauche',
  right: 'droite',
  up: 'haut',
  down: 'bas',
  space: 'espace',
  enter: 'entrée',
  cross: 'croix',
  circle: 'cercle',
  controllerOf: 'manette {name}',
}

export const COPY: Record<Locale, Copy> = { da, en, es, de, zh, hi, fr }

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.some((locale) => locale === value)
}

export function fill(text: string, name: string): string {
  return text.replaceAll('{name}', name)
}
