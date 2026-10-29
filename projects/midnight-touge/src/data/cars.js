// Cars Data for Midnight Touge (《夜峠》)

export const CARS_DATA = [
  {
    id: "h86",
    name: "霧嶺 H-86 白疾",
    subtitle: "LIGHTWEIGHT FR HATCHBACK",
    badge: "白疾 · 熊貓雙色",
    drivetrain: "FR (前置後驅)",
    engine: "1.6L 16V 雙凸輪軸 自然進氣",
    horsepower: 145,
    weight: 940,
    topSpeed: 185,
    acceleration: 7.2,
    handling: 94,
    driftEase: 96,
    unlocked: true,
    price: 0,
    modelPath: "assets/models/car_h86.glb?v=cc0v3",
    desc: "八十年代末期原創輕量化後驅掀背。車重不足一噸，前後配重極致均衡，底盤反饋清晰靈敏。在急彎與五連髮夾彎中，能憑藉重心轉移與手煞輕易切入大角度甩尾。",
    colors: [
      { name: "熊貓雙色 (Panda White)", hex: "#F2F4F8", isTwoTone: true },
      { name: "午夜群青 (Deep Teal)", hex: "#0E2832", isTwoTone: false },
      { name: "黑曜墨黑 (Obsidian Black)", hex: "#16181A", isTwoTone: false },
      { name: "冠軍赤紅 (Championship Red)", hex: "#B81D18", isTwoTone: false }
    ],
    tuning: {
      powerMultiplier: 1.0,
      mass: 940,
      turnRate: 3.2,
      driftFriction: 0.88,
      counterSteerStrength: 1.35
    }
  },
  {
    id: "gt20",
    name: "黑曜 GT-20 烈風",
    subtitle: "TURBOCHARGED FR COUPE",
    badge: "烈風 · 渦輪雙尾燈",
    drivetrain: "FR (前置後驅)",
    engine: "2.0L 雙頂置凸輪 渦輪增壓",
    horsepower: 235,
    weight: 1220,
    topSpeed: 230,
    acceleration: 5.6,
    handling: 85,
    driftEase: 88,
    unlocked: false,
    price: 1500,
    unlockCondition: "獲得 3 枚金牌或 1500 峠幣解鎖",
    modelPath: "assets/models/car_gt20.glb?v=cc0v3",
    desc: "九十年代黃金期代表性渦輪跑車。強勁扭力在中高轉速爆發，直線加速迅猛凌厲。甩尾時需要更細膩的油門控制，出彎時伴隨濃密白煙與令人著迷的渦輪洩壓聲。",
    colors: [
      { name: "深海墨綠 (Midnight Emerald)", hex: "#1A6B6E", isTwoTone: false },
      { name: "槍鐵灰 (Gunmetal Grey)", hex: "#3A3D42", isTwoTone: false },
      { name: "珍珠白 (Pearl White)", hex: "#EAEAEA", isTwoTone: false },
      { name: "耀夜黑 (Jet Black)", hex: "#111113", isTwoTone: false }
    ],
    tuning: {
      powerMultiplier: 1.45,
      mass: 1220,
      turnRate: 2.8,
      driftFriction: 0.84,
      counterSteerStrength: 1.2
    }
  },
  {
    id: "re7",
    name: "赤焰 RE-7 轉子夜影",
    subtitle: "TWIN-ROTOR ROTARY COUPE",
    badge: "雙轉子 · 終極夜影",
    drivetrain: "FR (前中置後驅)",
    engine: "1.3L 雙轉子 序列雙渦輪",
    horsepower: 280,
    weight: 1180,
    topSpeed: 255,
    acceleration: 4.9,
    handling: 98,
    driftEase: 92,
    unlocked: false,
    price: 3500,
    unlockCondition: "擊敗霧嶺魔王或 3500 峠幣解鎖",
    modelPath: "assets/models/car_re7.glb?v=cc0v3",
    desc: "殿堂級轉子跑車，極致的前中置引擎佈局與50:50完美配重。高達8,500轉的尖銳轉子咆哮，入彎時擁有極高物理極限，能以難以置信的高速滑移橫切過每一個髮夾彎心。",
    colors: [
      { name: "烈焰紅 (Formula Red)", hex: "#B81414", isTwoTone: false },
      { name: "閃耀黃 (Competition Yellow)", hex: "#E0A814", isTwoTone: false },
      { name: "純白 (Innocent White)", hex: "#FAFAFA", isTwoTone: false },
      { name: "午夜紫 (Midnight Purple)", hex: "#221128", isTwoTone: false }
    ],
    tuning: {
      powerMultiplier: 1.75,
      mass: 1180,
      turnRate: 3.5,
      driftFriction: 0.82,
      counterSteerStrength: 1.45
    }
  }
];

// Helper to find car by ID with legacy alias support
export function getCarById(id) {
  const aliasMap = {
    rs86: "h86",
    st20: "gt20",
    rx7: "re7"
  };
  const resolvedId = aliasMap[id] || id;
  return CARS_DATA.find(c => c.id === resolvedId) || CARS_DATA[0];
}
