const ICONS8 = 'https://img.icons8.com';

const png = (name, pack = 'color', size = 480) =>
  `${ICONS8}/${pack}/${size}/${name}.png`;

const SUBJECT_IMAGES = {
  'Cloud Computing': png('google-cloud'),
  'C Programming': png('c-programming'),
  AT: png('flow-chart'),
  Python: png('python'),
  Algorithm: png('sorting-arrows'),
  CN: png('network'),
  CSCL: png('collaboration'),
  'Data Structures': png('data-configuration'),
  DBMS: png('database'),
  DCN: png('router'),
  DMS: png('math'),
  DSMP: png('combo-chart'),
  IoT: png('internet-of-things'),
  Java: png('java-coffee-cup-logo'),
  Maths: png('math'),
  ML: png('artificial-intelligence'),
  OOP: png('class'),
  OS: png('linux'),
  WebTech: png('html-5'),
  JavaScript: png('javascript'),
  'Android Dev': png('android-os'),
  'Cyber Security': png('cyber-security'),
  DevOps: png('docker'),
  Blockchain: png('ethereum'),
  'Game Development': png('unity'),
  'UI/UX Design': png('figma'),
  'Software Engineering': png('github'),
};

export const DEFAULT_SUBJECT_IMAGE = png('code');

export const getSubjectImage = (subject) =>
  SUBJECT_IMAGES[subject] || DEFAULT_SUBJECT_IMAGE;

