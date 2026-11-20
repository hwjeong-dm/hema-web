export interface PatternData {
  question: string;
  circleDistance: number;
}

export interface CalculateData {
  question: string;
  answer: number;
}

export function getPatternList(): PatternData[] {
  return [
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.0', circleDistance: 0.0 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.25', circleDistance: 0.25 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.5', circleDistance: 0.5 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
    { question: '0.75', circleDistance: 0.75 },
  ];
}

const step1Data: CalculateData[] = [
  { question: '8+6', answer: 14 }, { question: '7+7', answer: 14 },
  { question: '9+7', answer: 16 }, { question: '2+4', answer: 6 },
  { question: '7+9', answer: 16 }, { question: '6+6', answer: 12 },
  { question: '8+4', answer: 12 }, { question: '3+3', answer: 6 },
  { question: '5+9', answer: 14 }, { question: '2+9', answer: 11 },
  { question: '8+2', answer: 10 }, { question: '3+2', answer: 5 },
  { question: '4+1', answer: 5 },  { question: '7+8', answer: 15 },
  { question: '9+2', answer: 11 }, { question: '5+3', answer: 8 },
  { question: '4+3', answer: 7 },  { question: '4+4', answer: 8 },
  { question: '2+5', answer: 7 },  { question: '9+3', answer: 12 },
  { question: '7+2', answer: 9 },  { question: '1+8', answer: 9 },
  { question: '2+8', answer: 10 }, { question: '7+1', answer: 8 },
];

const step2Data: CalculateData[] = [
  { question: '5+80', answer: 85 },  { question: '1+54', answer: 55 },
  { question: '3+85', answer: 88 },  { question: '5+88', answer: 93 },
  { question: '4+11', answer: 15 },  { question: '2+68', answer: 70 },
  { question: '6+41', answer: 47 },  { question: '2+90', answer: 92 },
  { question: '4+85', answer: 89 },  { question: '2+23', answer: 25 },
  { question: '6+70', answer: 76 },  { question: '9+15', answer: 24 },
  { question: '1+83', answer: 84 },  { question: '5+90', answer: 95 },
  { question: '5+13', answer: 18 },  { question: '9+87', answer: 96 },
  { question: '8+31', answer: 39 },  { question: '3+37', answer: 40 },
  { question: '5+21', answer: 26 },  { question: '5+85', answer: 90 },
  { question: '2+87', answer: 89 },  { question: '4+59', answer: 63 },
  { question: '7+59', answer: 66 },  { question: '7+15', answer: 22 },
  { question: '3+97', answer: 100 }, { question: '5+46', answer: 51 },
  { question: '4+93', answer: 97 },  { question: '6+78', answer: 84 },
  { question: '2+83', answer: 85 },
];

const step3Data: CalculateData[] = [
  { question: '93+50', answer: 143 },  { question: '42+77', answer: 119 },
  { question: '11+58', answer: 69 },   { question: '90+67', answer: 157 },
  { question: '65+54', answer: 119 },  { question: '29+33', answer: 62 },
  { question: '36+83', answer: 119 },  { question: '55+91', answer: 146 },
  { question: '72+28', answer: 100 },  { question: '44+68', answer: 112 },
  { question: '17+94', answer: 111 },  { question: '83+39', answer: 122 },
  { question: '61+71', answer: 132 },  { question: '52+69', answer: 121 },
  { question: '74+88', answer: 162 },  { question: '36+95', answer: 131 },
  { question: '48+72', answer: 120 },  { question: '67+54', answer: 121 },
  { question: '83+47', answer: 130 },  { question: '95+76', answer: 171 },
  { question: '62+88', answer: 150 },  { question: '74+37', answer: 111 },
  { question: '56+95', answer: 151 },  { question: '89+43', answer: 132 },
  { question: '75+86', answer: 161 },  { question: '37+94', answer: 131 },
  { question: '68+73', answer: 141 },  { question: '49+62', answer: 111 },
  { question: '83+58', answer: 141 },  { question: '76+45', answer: 121 },
];

const step4Data: CalculateData[] = [
  { question: '99+622', answer: 721 },  { question: '45+740', answer: 785 },
  { question: '94+289', answer: 383 },  { question: '56+734', answer: 790 },
  { question: '54+824', answer: 878 },  { question: '56+185', answer: 241 },
  { question: '55+521', answer: 576 },  { question: '76+817', answer: 893 },
  { question: '99+124', answer: 223 },  { question: '26+695', answer: 721 },
  { question: '96+264', answer: 360 },  { question: '91+347', answer: 438 },
  { question: '29+951', answer: 980 },  { question: '86+271', answer: 357 },
  { question: '56+557', answer: 613 },  { question: '30+481', answer: 511 },
  { question: '55+745', answer: 800 },  { question: '37+297', answer: 334 },
  { question: '90+236', answer: 326 },  { question: '81+789', answer: 870 },
  { question: '95+478', answer: 573 },  { question: '39+787', answer: 826 },
  { question: '81+590', answer: 671 },  { question: '52+853', answer: 905 },
  { question: '44+989', answer: 1033 }, { question: '45+814', answer: 859 },
  { question: '79+266', answer: 345 },  { question: '74+907', answer: 981 },
  { question: '89+380', answer: 469 },  { question: '40+959', answer: 999 },
];

const step5Data: CalculateData[] = [
  { question: '245+801', answer: 1046 }, { question: '605+893', answer: 1498 },
  { question: '231+774', answer: 1005 }, { question: '926+900', answer: 1826 },
  { question: '763+738', answer: 1501 }, { question: '370+212', answer: 582 },
  { question: '785+128', answer: 913 },  { question: '115+943', answer: 1058 },
  { question: '713+157', answer: 870 },  { question: '986+469', answer: 1455 },
  { question: '839+937', answer: 1776 }, { question: '323+166', answer: 489 },
  { question: '174+884', answer: 1058 }, { question: '656+871', answer: 1527 },
  { question: '491+506', answer: 997 },  { question: '499+710', answer: 1209 },
  { question: '316+687', answer: 1003 }, { question: '906+798', answer: 1704 },
  { question: '805+192', answer: 997 },  { question: '527+683', answer: 1210 },
  { question: '421+399', answer: 820 },  { question: '844+294', answer: 1138 },
  { question: '995+887', answer: 1882 }, { question: '513+791', answer: 1304 },
  { question: '517+625', answer: 1142 }, { question: '564+567', answer: 1131 },
  { question: '543+650', answer: 1193 }, { question: '727+593', answer: 1320 },
  { question: '637+614', answer: 1251 }, { question: '445+910', answer: 1355 },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCalculateData(step: number): CalculateData {
  switch (step) {
    case 1: return randomFrom(step1Data);
    case 2: return randomFrom(step2Data);
    case 3: return randomFrom(step3Data);
    case 4: return randomFrom(step4Data);
    default: return randomFrom(step5Data);
  }
}

export function getRandomCircleHorizontalBias(): number {
  return (Math.floor(Math.random() * (82 - 18 + 1)) + 18) / 100;
}

export function getRandomCircleDirection(): 1 | -1 {
  return Math.random() < 0.5 ? 1 : -1;
}
