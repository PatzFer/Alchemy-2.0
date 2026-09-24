import {
  WellbeingState,
  WeeklyMenuPlan,
  ShoppingItem,
  MovementSession,
  ProgressLog,
  EnergyLevel,
} from '../types';

export const EMPTY_WELLBEING_STATE: WellbeingState = {
  preferences: {
    allowWellbeingDataToAI: false,
    preferredWeightUnit: 'kg',
    preferredMeasurementUnit: 'cm',
    foodPreferences: {
      dietaryStyle: '',
      exclusions: [],
      partnerSharedDinnerDays: [],
      quickPrepWeekdaysMaxMinutes: 30,
      pantryStaples: [],
      cycleSyncNutrition: false,
    },
    movementPreferences: {
      preferredTypes: [],
      typicalSessionMinutes: 30,
      preferredTimeOfDay: 'morning',
      listenToCycleEnergy: true,
    },
  },
  progressLogs: [],
  photos: [],
  goals: [],
  milestones: [],
  checkInConfigs: [],
  movementHistory: [],
  currentWeeklyMovement: {
    weekStarting: new Date().toISOString().split('T')[0],
    targetWeeklySessions: 3,
    focusTheme: '',
    sessions: [],
  },
  weeklyMenu: {
    id: 'wm-empty',
    weekStarting: new Date().toISOString().split('T')[0],
    preferencesApplied: {
      dietaryNotes: '',
      exclusions: [],
      antiInflammatoryFocus: false,
      cycleSyncEnabled: false,
    },
    days: [],
  },
  shoppingList: [],
  waterTracker: {
    bottleVolumeMl: 750,
    defaultTargetBottles: 4,
    history: [],
  },
  bodyMeasurementHistory: [],
  weeklyBodyCheckReminder: {
    enabled: true,
    dayOfWeek: 'sunday',
    preferredTime: '09:00',
    snoozedUntil: null,
  },
};

export const INITIAL_WELLBEING_STATE: WellbeingState = {
  preferences: {
    allowWellbeingDataToAI: false, // Default false: user explicitly controls AI access
    preferredWeightUnit: 'kg',
    preferredMeasurementUnit: 'cm',
    foodPreferences: {
      dietaryStyle: 'Zuid-Europees & Mediterraan (Portugees, Italiaans, Spaans, Grieks, Belgisch)',
      exclusions: ['Couscous', 'Quinoa', 'Rauwe groenten', 'Komkommer', 'Kabeljauw'],
      partnerSharedDinnerDays: ['Friday', 'Saturday', 'Sunday'],
      quickPrepWeekdaysMaxMinutes: 30,
      pantryStaples: ['Extra vierge olijfolie', 'Zeezout', 'Knoflook', 'Witte rijst', 'Aardappelen', 'Passata'],
      cycleSyncNutrition: false,
    },
    movementPreferences: {
      preferredTypes: ['pilates', 'walking', 'strength', 'yoga_stretch'],
      typicalSessionMinutes: 30,
      preferredTimeOfDay: 'morning',
      listenToCycleEnergy: true,
    },
  },

  progressLogs: [
    {
      id: 'pl-1',
      date: '2026-08-20',
      weightKg: 61.2,
      measurements: {
        waistCm: 68,
        hipsCm: 96,
        chestCm: 88,
      },
      composition: {
        bodyFatPercentage: 22.4,
        muscleMassPercentage: 33.1,
        hydrationPercentage: 54.0,
      },
      feelingNotes: 'Grounded and steady. Digestion light.',
      recordedFact: 'Weight recorded at 61.2 kg; waist 68 cm.',
      aiInterpretation: 'Baseline observation recorded at early follicular transition.',
    },
    {
      id: 'pl-2',
      date: '2026-08-27',
      weightKg: 61.0,
      measurements: {
        waistCm: 67.5,
        hipsCm: 96,
        chestCm: 88,
      },
      feelingNotes: 'High creative energy, sustained post-pilates endurance.',
      recordedFact: 'Weight stable within 0.2 kg variance.',
      aiInterpretation: 'Sustained muscular recovery following consistent morning movement cadence.',
    },
    {
      id: 'pl-3',
      date: '2026-09-04',
      weightKg: 61.5,
      measurements: {
        waistCm: 68.2,
        hipsCm: 96.5,
        chestCm: 88.5,
      },
      feelingNotes: 'Slight luteal fluid retention, natural and comfortable.',
      recordedFact: 'Recorded +0.5 kg elevation in weight.',
      aiInterpretation: 'Typical transient luteal water retention pattern; structural measurements remain stable.',
    },
    {
      id: 'pl-4',
      date: '2026-09-12',
      weightKg: 60.8,
      measurements: {
        waistCm: 67.0,
        hipsCm: 95.8,
        chestCm: 87.5,
      },
      composition: {
        bodyFatPercentage: 21.9,
        muscleMassPercentage: 33.4,
        hydrationPercentage: 55.2,
      },
      feelingNotes: 'Clear head, restful sleep, balanced stamina.',
      recordedFact: 'Net waist variance of -1.0 cm across 3-week observation window.',
      aiInterpretation: 'Reflects progressive tone and reduced systemic inflammation without calorie deficit strain.',
    },
  ],

  photos: [
    {
      id: 'photo-1',
      date: '2026-09-01',
      pose: 'front',
      notes: 'Morning posture posture check: upright, relaxed shoulders, open collarbones.',
    },
  ],

  goals: [
    {
      id: 'wg-1',
      title: 'Gentle morning movement consistency',
      targetMetric: 'Sessions per week',
      targetValue: '4 sessions',
      currentValue: '3-4 sessions',
      status: 'active',
      notes: 'Focus on rhythm and joint mobility rather than high-stress intensity.',
    },
    {
      id: 'wg-2',
      title: 'Post-dinner digestive ease & screen-free buffer',
      targetMetric: 'Wind-down buffer',
      targetValue: '60 mins',
      currentValue: '45 mins',
      status: 'active',
      notes: 'Protect evening nervous system restoration.',
    },
  ],

  milestones: [
    {
      id: 'wm-1',
      title: 'Completed 8-week consistent reformer pilates foundation',
      date: '2026-09-10',
      category: 'movement',
      description: 'Maintained graceful strength without joint strain.',
      celebrated: true,
    },
    {
      id: 'wm-2',
      title: 'Anti-inflammatory pantry transition complete',
      date: '2026-09-02',
      category: 'habit',
      description: 'Replaced industrial seed oils with estate extra-virgin olive oil and avocado oil.',
      celebrated: true,
    },
  ],

  checkInConfigs: [
    {
      id: 'cic-1',
      title: 'Sunday Morning Rhythm & Reflection',
      frequency: 'weekly',
      preferredDay: 'sunday',
      includeWeight: true,
      includeMeasurements: true,
      includeComposition: false,
      includePhotos: false,
      includeReflection: true,
      reflectionPrompt: 'How did your energy feel this week? What nourished you most?',
      active: true,
      lastCompletedDate: '2026-09-13',
      nextDueDate: '2026-09-20',
    },
    {
      id: 'cic-2',
      title: 'Monthly Body Composition & Milestones',
      frequency: 'monthly',
      preferredDay: 'monday',
      includeWeight: true,
      includeMeasurements: true,
      includeComposition: true,
      includePhotos: true,
      includeReflection: true,
      reflectionPrompt: 'Reflect on physical strength, recovery, and quiet milestones achieved over the last 30 days.',
      active: true,
      lastCompletedDate: '2026-09-01',
      nextDueDate: '2026-10-01',
    },
  ],

  movementHistory: [
    {
      id: 'mh-1',
      date: '2026-09-14',
      title: 'Unhurried Mat Pilates & Core Alignment',
      type: 'pilates',
      plannedDurationMins: 30,
      actualDurationMins: 32,
      intensity: 'moderate',
      completed: true,
      energyLevelAtStart: 'normal',
      perceivedExertion: 'pleasantly_challenged',
      exercises: [
        { name: 'Pelvic clocks & diaphragmatic breath', durationMins: 5 },
        { name: 'Bridging with inner-thigh squeeze', sets: 3, reps: '10' },
        { name: 'Single-leg stretch & criss-cross', sets: 3, reps: '12' },
        { name: 'Swan prep & thoracic extension', sets: 2, reps: '8' },
        { name: 'Restorative child pose & side stretch', durationMins: 5 },
      ],
      notes: 'Felt centered and strong. Breath synchronized naturally.',
    },
    {
      id: 'mh-2',
      date: '2026-09-15',
      title: 'Pine Grove Brisk Walk & Sunshine',
      type: 'walking',
      plannedDurationMins: 45,
      actualDurationMins: 40,
      intensity: 'gentle',
      completed: true,
      energyLevelAtStart: 'good',
      perceivedExertion: 'effortless',
      exercises: [
        { name: 'Brisk cadence walk in natural sunlight', durationMins: 35 },
        { name: 'Calf & hamstring stretch on park bench', durationMins: 5 },
      ],
      notes: 'Cleared cognitive fatigue from morning client reviews.',
    },
  ],

  currentWeeklyMovement: {
    weekStarting: '2026-09-14',
    targetWeeklySessions: 4,
    focusTheme: 'Postural Sovereignty & Fluid Mobility',
    sessions: [
      {
        id: 'ms-today',
        date: new Date().toISOString().split('T')[0],
        title: 'Core Stability & Hip Mobility Flow',
        type: 'pilates',
        plannedDurationMins: 25,
        intensity: 'moderate',
        completed: false,
        exercises: [
          { name: 'Spine articulation & pelvic series', durationMins: 5 },
          { name: 'Side-lying clamshells & leg lifts', sets: 2, reps: '12 each' },
          { name: 'Quadruped bird-dog with 3s hold', sets: 3, reps: '8 each' },
          { name: 'Mermaid side bend with deep ribcage expansion', durationMins: 5 },
        ],
        notes: 'Designed to fit cleanly into morning schedule before 10:00 client call.',
      },
      {
        id: 'ms-thu',
        date: '2026-09-17',
        title: 'Functional Full-Body Resistance',
        type: 'strength',
        plannedDurationMins: 30,
        intensity: 'moderate',
        completed: false,
        exercises: [
          { name: 'Goblet squats with light dumbbell', sets: 3, reps: '10' },
          { name: 'Dumbbell Romanian deadlifts', sets: 3, reps: '10' },
          { name: 'Half-kneeling overhead press', sets: 2, reps: '8' },
          { name: 'Chest-supported dumbbell row', sets: 3, reps: '10' },
        ],
        notes: 'Unhurried tempo with 60s rest between sets.',
      },
      {
        id: 'ms-fri',
        date: '2026-09-18',
        title: 'Coastal Walk & Sensory Rest',
        type: 'walking',
        plannedDurationMins: 40,
        intensity: 'gentle',
        completed: false,
        exercises: [
          { name: 'Unhurried nature walk without headphones', durationMins: 35 },
          { name: 'Grounding calf stretch & ankle rotations', durationMins: 5 },
        ],
        notes: 'Transition into the weekend.',
      },
      {
        id: 'ms-sat',
        date: '2026-09-19',
        title: 'Vinyasa Flow & Deep Hip Opening',
        type: 'yoga_stretch',
        plannedDurationMins: 35,
        intensity: 'gentle',
        completed: false,
        exercises: [
          { name: 'Sun salutations with slow breaths', durationMins: 10 },
          { name: 'Pigeon pose & low lunge series', durationMins: 15 },
          { name: 'Supported savasana & guided body scan', durationMins: 10 },
        ],
        notes: 'Restorative weekend rhythm.',
      },
    ],
  },

  weeklyMenu: {
    id: 'wm-current',
    weekStarting: '2026-09-14',
    theme: 'Clean Mediterranean & Sustained Vitality',
    preferencesApplied: {
      dietaryNotes: 'Whole-food Mediterranean, olive-oil forward, refined sugar free',
      exclusions: ['Excess refined sugar'],
      antiInflammatoryFocus: true,
      cycleSyncEnabled: true,
    },
    days: [
      {
        dayOfWeek: 'Monday',
        isWorkday: true,
        availablePrepTimeMinutes: 20,
        diningSettingDinner: 'solo',
        meals: {
          breakfast: {
            id: 'm-mon-b',
            name: 'Soft boiled pasture eggs with seeded sourdough & avocado',
            category: 'breakfast',
            prepTimeMinutes: 10,
            cookingTimeMinutes: 8,
            diningSetting: 'solo',
            ingredients: ['Pasture eggs', 'Seeded sourdough', 'Avocado', 'Flaky sea salt', 'Cold-pressed olive oil'],
            tags: ['High protein', 'Healthy fats'],
          },
          lunch: {
            id: 'm-mon-l',
            name: 'Tuscan white bean & roasted kale bowl with lemon-tahini',
            category: 'lunch',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Cannellini beans', 'Baby kale', 'Tahini', 'Lemon', 'Cucumber', 'Pumpkin seeds'],
            tags: ['Plant-forward', 'Fiber-rich'],
          },
          dinner: {
            id: 'm-mon-d',
            name: 'Pan-seared wild salmon with braised fennel & steamed asparagus',
            category: 'dinner',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 12,
            diningSetting: 'solo',
            ingredients: ['Wild salmon fillets', 'Fennel bulb', 'Asparagus', 'Fresh dill', 'Lemon'],
            tags: ['Omega-3', 'Anti-inflammatory', 'Quick prep'],
          },
          snack: {
            id: 'm-mon-s',
            name: 'Greek sheep yogurt with wild blueberries & walnuts',
            category: 'snack',
            prepTimeMinutes: 3,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Greek yogurt', 'Wild blueberries', 'Walnuts'],
            tags: ['Antioxidant'],
          },
        },
      },
      {
        dayOfWeek: 'Tuesday',
        isWorkday: true,
        availablePrepTimeMinutes: 20,
        diningSettingDinner: 'solo',
        meals: {
          breakfast: {
            id: 'm-tue-b',
            name: 'Creamy steel-cut oats with chia seeds, cinnamon & fresh figs',
            category: 'breakfast',
            prepTimeMinutes: 5,
            cookingTimeMinutes: 15,
            diningSetting: 'solo',
            ingredients: ['Steel-cut oats', 'Chia seeds', 'Ceylon cinnamon', 'Fresh figs', 'Almond milk'],
            tags: ['Sustained carbs', 'Warm digestive start'],
          },
          lunch: {
            id: 'm-tue-l',
            name: 'Warm quinoa bowl with roasted sweet potato & pumpkin seed pesto',
            category: 'lunch',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Quinoa', 'Roasted sweet potato', 'Baby spinach', 'Pumpkin seeds', 'Basil pesto'],
            tags: ['Complex carbs', 'Mineral-dense'],
          },
          dinner: {
            id: 'm-tue-d',
            name: 'Lemon-herb roasted chicken breast with French green lentils',
            category: 'dinner',
            prepTimeMinutes: 10,
            cookingTimeMinutes: 22,
            diningSetting: 'solo',
            ingredients: ['Organic chicken breast', 'Puy green lentils', 'Fresh rosemary', 'Dijon mustard', 'Olive oil'],
            tags: ['Lean protein', 'Iron-rich'],
          },
        },
      },
      {
        dayOfWeek: 'Wednesday',
        isWorkday: true,
        availablePrepTimeMinutes: 25,
        diningSettingDinner: 'solo',
        meals: {
          breakfast: {
            id: 'm-wed-b',
            name: 'Poached eggs over sautéed spinach & shiitake mushrooms',
            category: 'breakfast',
            prepTimeMinutes: 5,
            cookingTimeMinutes: 10,
            diningSetting: 'solo',
            ingredients: ['Pasture eggs', 'Baby spinach', 'Shiitake mushrooms', 'Ghee or olive oil'],
            tags: ['High protein', 'Immune support'],
          },
          lunch: {
            id: 'm-wed-l',
            name: 'Mediterranean chopped salad with chickpeas, olives & Persian cucumber',
            category: 'lunch',
            prepTimeMinutes: 12,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Chickpeas', 'Kalamata olives', 'Persian cucumbers', 'Cherry tomatoes', 'Feta cheese', 'Oregano'],
            tags: ['Hydrating', 'Crisp'],
          },
          dinner: {
            id: 'm-wed-d',
            name: 'Slow-simmered zucchini & cod stew with saffron and cherry tomatoes',
            category: 'dinner',
            prepTimeMinutes: 10,
            cookingTimeMinutes: 18,
            diningSetting: 'solo',
            ingredients: ['Fresh cod fillet', 'Zucchini', 'Cherry tomatoes', 'Pinch of saffron', 'Garlic', 'Shallots'],
            tags: ['Light evening digestion', 'Low inflammation'],
          },
        },
      },
      {
        dayOfWeek: 'Thursday',
        isWorkday: true,
        availablePrepTimeMinutes: 20,
        diningSettingDinner: 'solo',
        meals: {
          breakfast: {
            id: 'm-thu-b',
            name: 'Chia pudding with coconut milk, raspberries & roasted cacao nibs',
            category: 'breakfast',
            prepTimeMinutes: 5,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Chia seeds', 'Coconut milk', 'Fresh raspberries', 'Cacao nibs'],
            tags: ['Fiber-dense', 'Magnesium'],
          },
          lunch: {
            id: 'm-thu-l',
            name: 'Leftover zucchini & cod stew with crusty sourdough',
            category: 'lunch',
            prepTimeMinutes: 5,
            cookingTimeMinutes: 5,
            diningSetting: 'solo',
            ingredients: ['Cod stew leftovers', 'Seeded sourdough'],
            tags: ['Effortless workday lunch'],
          },
          dinner: {
            id: 'm-thu-d',
            name: 'Warm spiced grass-fed beef kefta with roasted carrots & minted labneh',
            category: 'dinner',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 15,
            diningSetting: 'solo',
            ingredients: ['Grass-fed minced beef', 'Cumin & coriander', 'Heritage carrots', 'Labneh or Greek yogurt', 'Fresh mint'],
            tags: ['Bioavailable iron', 'Grounding'],
          },
        },
      },
      {
        dayOfWeek: 'Friday',
        isWorkday: true,
        availablePrepTimeMinutes: 35,
        diningSettingDinner: 'shared_partner',
        meals: {
          breakfast: {
            id: 'm-fri-b',
            name: 'Soft scrambled eggs with chives and smoked salmon',
            category: 'breakfast',
            prepTimeMinutes: 5,
            cookingTimeMinutes: 7,
            diningSetting: 'solo',
            ingredients: ['Pasture eggs', 'Smoked salmon', 'Fresh chives', 'Sourdough'],
            tags: ['High protein', 'Deluxe start'],
          },
          lunch: {
            id: 'm-fri-l',
            name: 'Arugula and shaved parmesan salad with toasted pine nuts & prosciutto',
            category: 'lunch',
            prepTimeMinutes: 10,
            cookingTimeMinutes: 0,
            diningSetting: 'solo',
            ingredients: ['Wild baby arugula', 'Aged parmesan', 'Pine nuts', 'Prosciutto di Parma', 'Balsamic glaze'],
            tags: ['Quick luxury'],
          },
          dinner: {
            id: 'm-fri-d',
            name: 'Partner Dinner: Pan-roasted sea bass with lemon-caper butter & blistered broccolini',
            category: 'dinner',
            prepTimeMinutes: 20,
            cookingTimeMinutes: 20,
            diningSetting: 'shared_partner',
            ingredients: ['Whole sea bass or fillets', 'Capers in sea salt', 'Broccolini', 'Grass-fed butter', 'Lemons', 'Crispy baby potatoes'],
            tags: ['Shared partner dinner', 'Aesthetic ritual', 'Celebratory'],
          },
        },
      },
      {
        dayOfWeek: 'Saturday',
        isWorkday: false,
        availablePrepTimeMinutes: 45,
        diningSettingDinner: 'shared_partner',
        meals: {
          breakfast: {
            id: 'm-sat-b',
            name: 'Weekend slow brunch: Ricotta & lemon zest pancakes with berries',
            category: 'breakfast',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 15,
            diningSetting: 'shared_partner',
            ingredients: ['Fresh whole ricotta', 'Pasture eggs', 'Oat flour', 'Lemon zest', 'Maple syrup', 'Mixed berries'],
            tags: ['Unhurried morning', 'Shared ritual'],
          },
          lunch: {
            id: 'm-sat-l',
            name: 'Light gazpacho or heirloom tomato tartine',
            category: 'lunch',
            prepTimeMinutes: 15,
            cookingTimeMinutes: 0,
            diningSetting: 'shared_partner',
            ingredients: ['Heirloom tomatoes', 'Sourdough', 'Sea salt', 'Basil'],
            tags: ['Sunny weekend'],
          },
          dinner: {
            id: 'm-sat-d',
            name: 'Partner Dinner: Tagliata di manzo with rosemary, roasted garlic & arugula',
            category: 'dinner',
            prepTimeMinutes: 20,
            cookingTimeMinutes: 25,
            diningSetting: 'shared_partner',
            ingredients: ['Ribeye or tenderloin steak', 'Fresh rosemary', 'Head of garlic', 'Wild arugula', 'Parmigiano Reggiano'],
            tags: ['Shared partner dinner', 'Rich flavor', 'Sovereign table'],
          },
        },
      },
      {
        dayOfWeek: 'Sunday',
        isWorkday: false,
        availablePrepTimeMinutes: 30,
        diningSettingDinner: 'shared_partner',
        meals: {
          breakfast: {
            id: 'm-sun-b',
            name: 'Avocado tartine with soft jammy egg and dukkah spice',
            category: 'breakfast',
            prepTimeMinutes: 10,
            cookingTimeMinutes: 7,
            diningSetting: 'solo',
            ingredients: ['Avocado', 'Pasture eggs', 'Egyptian dukkah spice', 'Sourdough'],
            tags: ['Flavorful', 'Energizing'],
          },
          lunch: {
            id: 'm-sun-l',
            name: 'Market roast vegetable salad with warm goat cheese medallions',
            category: 'lunch',
            prepTimeMinutes: 20,
            cookingTimeMinutes: 15,
            diningSetting: 'shared_partner',
            ingredients: ['Mixed roasted vegetables', 'Chèvre goat cheese', 'Walnuts', 'Honey-dijon dressing'],
            tags: ['Cozy Sunday'],
          },
          dinner: {
            id: 'm-sun-d',
            name: 'Partner Dinner: Herb-crusted baked cod with roasted leeks and creamy polenta',
            category: 'dinner',
            prepTimeMinutes: 20,
            cookingTimeMinutes: 25,
            diningSetting: 'shared_partner',
            ingredients: ['Fresh cod fillets', 'Leeks', 'Organic polenta', 'Parmesan', 'Fresh thyme'],
            tags: ['Comforting prep for the week', 'Shared partner dinner'],
          },
        },
      },
    ],
  },

  shoppingList: [
    { id: 'sl-1', name: 'Wild salmon fillets', category: 'proteins', quantity: '2 fresh portions', inPantry: false, checked: false, isManual: false },
    { id: 'sl-2', name: 'Pasture eggs', category: 'dairy_refrigerated', quantity: '1 dozen', inPantry: true, checked: true, isManual: false },
    { id: 'sl-3', name: 'Asparagus', category: 'produce', quantity: '1 bunch', inPantry: false, checked: false, isManual: false },
    { id: 'sl-4', name: 'Fennel bulb', category: 'produce', quantity: '2 medium', inPantry: false, checked: false, isManual: false },
    { id: 'sl-5', name: 'Cannellini beans', category: 'pantry', quantity: '2 cans', inPantry: true, checked: true, isManual: false },
    { id: 'sl-6', name: 'Baby kale', category: 'produce', quantity: '200g', inPantry: false, checked: false, isManual: false },
    { id: 'sl-7', name: 'Organic chicken breasts', category: 'proteins', quantity: '400g', inPantry: false, checked: false, isManual: false },
    { id: 'sl-8', name: 'Fresh cod fillets', category: 'proteins', quantity: '4 portions', inPantry: false, checked: false, isManual: false },
    { id: 'sl-9', name: 'Whole sea bass', category: 'proteins', quantity: '2 fresh fish (Friday)', inPantry: false, checked: false, isManual: false },
    { id: 'sl-10', name: 'Puy green lentils', category: 'pantry', quantity: '1 bag', inPantry: true, checked: true, isManual: false },
    { id: 'sl-11', name: 'Broccolini', category: 'produce', quantity: '2 bunches', inPantry: false, checked: false, isManual: false },
    { id: 'sl-12', name: 'Lemons', category: 'produce', quantity: '6 organic', inPantry: false, checked: false, isManual: false },
    { id: 'sl-13', name: 'Cold-pressed extra virgin olive oil', category: 'pantry', quantity: '1 bottle', inPantry: true, checked: true, isManual: false },
    { id: 'sl-14', name: 'Wild blueberries', category: 'produce', quantity: '250g', inPantry: false, checked: false, isManual: false },
    { id: 'sl-15', name: 'Capers in sea salt', category: 'pantry', quantity: '1 small jar', inPantry: false, checked: false, isManual: false },
    { id: 'sl-16', name: 'Ceremonial grade matcha', category: 'other', quantity: '30g tin', inPantry: false, checked: false, isManual: true },
  ],
  waterTracker: {
    bottleVolumeMl: 750,
    defaultTargetBottles: 4,
    history: [
      { date: '2026-09-18', bottles: 3, volumeMl: 2250, targetBottles: 4 },
      { date: '2026-09-17', bottles: 4, volumeMl: 3000, targetBottles: 4 },
      { date: '2026-09-16', bottles: 3, volumeMl: 2250, targetBottles: 4 },
    ],
  },
  bodyMeasurementHistory: [
    {
      id: 'bm-1',
      date: '2026-08-20',
      unit: 'cm',
      shoulder: 99,
      bicepLeft: 27.5,
      bicepRight: 27.8,
      chest: 88,
      waist: 68,
      abdomen: 74,
      hip: 96,
      thighLeft: 54.5,
      thighRight: 54.7,
      calfLeft: 35.0,
      calfRight: 35.1,
      notes: 'Beginmeting ochtend nuchter',
    },
    {
      id: 'bm-2',
      date: '2026-09-13',
      unit: 'cm',
      shoulder: 99,
      bicepLeft: 27.2,
      bicepRight: 27.5,
      chest: 87.5,
      waist: 66.8,
      abdomen: 72.5,
      hip: 95.8,
      thighLeft: 54.0,
      thighRight: 54.2,
      calfLeft: 34.8,
      calfRight: 35.0,
      notes: 'Zondagochtend lichaamscheck',
    },
  ],
  weeklyBodyCheckReminder: {
    enabled: true,
    dayOfWeek: 'sunday',
    preferredTime: '09:00',
    snoozedUntil: null,
    lastCompletedDate: '2026-09-13',
  },
};

/**
 * Regenerates the shopping list by pulling all ingredients from the weekly menu
 * and merging with manual items or in-pantry states.
 */
export function generateShoppingListFromMenu(
  menu: WeeklyMenuPlan,
  currentShoppingList: ShoppingItem[]
): ShoppingItem[] {
  const manualItems = currentShoppingList.filter((item) => item.isManual);
  const pantryStateMap = new Map<string, boolean>();
  currentShoppingList.forEach((item) => {
    pantryStateMap.set(item.name.toLowerCase(), item.inPantry);
  });

  const ingredientMap = new Map<string, { category: ShoppingItem['category']; quantity: string }>();

  menu.days.forEach((day) => {
    const mealKeys: (keyof typeof day.meals)[] = ['breakfast', 'lunch', 'dinner'];
    if (day.meals.snack) mealKeys.push('snack');

    mealKeys.forEach((key) => {
      const meal = day.meals[key];
      if (!meal) return;
      meal.ingredients.forEach((ing) => {
        const lower = ing.trim();
        if (!lower) return;

        // Auto-categorize based on common keywords
        let category: ShoppingItem['category'] = 'produce';
        const l = lower.toLowerCase();
        if (l.includes('salmon') || l.includes('chicken') || l.includes('beef') || l.includes('cod') || l.includes('bass') || l.includes('prosciutto') || l.includes('egg') || l.includes('steak')) {
          category = 'proteins';
        } else if (l.includes('yogurt') || l.includes('feta') || l.includes('parmesan') || l.includes('ricotta') || l.includes('butter') || l.includes('milk') || l.includes('cheese')) {
          category = 'dairy_refrigerated';
        } else if (l.includes('oil') || l.includes('quinoa') || l.includes('oats') || l.includes('chia') || l.includes('beans') || l.includes('lentils') || l.includes('sourdough') || l.includes('seeds') || l.includes('walnuts') || l.includes('flour') || l.includes('cacao') || l.includes('tahini') || l.includes('olives') || l.includes('capers')) {
          category = 'pantry';
        } else if (l.includes('salt') || l.includes('cinnamon') || l.includes('dill') || l.includes('rosemary') || l.includes('mint') || l.includes('oregano') || l.includes('thyme') || l.includes('saffron') || l.includes('garlic') || l.includes('chives')) {
          category = 'herbs_spices';
        }

        if (!ingredientMap.has(lower)) {
          ingredientMap.set(lower, { category, quantity: '1-2 units / week' });
        }
      });
    });
  });

  const menuItems: ShoppingItem[] = Array.from(ingredientMap.entries()).map(([name, data], idx) => {
    const wasInPantry = pantryStateMap.get(name.toLowerCase()) || false;
    return {
      id: `sl-auto-${idx}-${Date.now()}`,
      name,
      category: data.category,
      quantity: data.quantity,
      inPantry: wasInPantry,
      checked: wasInPantry,
      isManual: false,
    };
  });

  return [...menuItems, ...manualItems];
}

/**
 * AI Progress Pattern Interpreter
 * Separates recorded facts from subjective interpretation
 */
export function interpretProgressTrends(logs: ProgressLog[]): {
  recordedFacts: string[];
  patterns: string[];
  guidance: string;
} {
  if (!logs || logs.length === 0) {
    return {
      recordedFacts: ['No progress measurements logged yet.'],
      patterns: ['Begin with an unhurried baseline log when ready.'],
      guidance: 'All measurements are strictly confidential and stored on your local device.',
    };
  }

  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const facts: string[] = [];
  const patterns: string[] = [];

  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  if (first.weightKg && latest.weightKg) {
    const diff = Number((latest.weightKg - first.weightKg).toFixed(1));
    facts.push(
      `Latest recorded weight is ${latest.weightKg} kg (overall span variance: ${diff > 0 ? `+${diff}` : `${diff}`} kg across ${sorted.length} records).`
    );
    if (Math.abs(diff) < 1.0) {
      patterns.push('Metabolic and fluid weight display consistent equilibrium without volatile swings.');
    } else if (diff < 0) {
      patterns.push('Gentle progressive downward trend observed alongside stable strength reports.');
    } else {
      patterns.push('Elevated measurements align with strength progression or natural phase fluid balance.');
    }
  }

  if (latest.measurements?.waistCm && first.measurements?.waistCm) {
    const waistDiff = Number((latest.measurements.waistCm - first.measurements.waistCm).toFixed(1));
    facts.push(`Waist measurement moved from ${first.measurements.waistCm} cm to ${latest.measurements.waistCm} cm (${waistDiff > 0 ? `+${waistDiff}` : waistDiff} cm).`);
    if (waistDiff < 0) {
      patterns.push('Core contour indicates reduced digestive bloating and improved postural tone.');
    }
  }

  if (latest.composition?.muscleMassPercentage) {
    facts.push(`Recorded muscle mass proportion: ${latest.composition.muscleMassPercentage}%.`);
  }

  return {
    recordedFacts: facts.length > 0 ? facts : ['Observations recorded across designated dates.'],
    patterns: patterns.length > 0 ? patterns : ['Regular movement supports nervous system vitality and muscle tone.'],
    guidance: 'Recorded facts represent objective empirical inputs. Interpretations offer lifestyle context only and never constitute medical advice.',
  };
}

/**
 * Adapt Workout Function
 * Adapts today's workout when available time or energy changes
 */
export function adaptMovementSession(
  session: MovementSession,
  availableMins: number,
  energy: EnergyLevel
): MovementSession {
  const adapted = JSON.parse(JSON.stringify(session)) as MovementSession;
  adapted.plannedDurationMins = availableMins;

  if (availableMins <= 15) {
    adapted.title = `Express Core & Posture Reset (${availableMins}m)`;
    adapted.exercises = [
      { name: 'Diaphragmatic breath & spine articulation', durationMins: 3 },
      { name: 'Gentle bird-dog & glute bridge flow', sets: 2, reps: '8' },
      { name: 'Child pose with lateral side stretch', durationMins: 4 },
    ];
    adapted.adaptationReason = `Adapted to compact ${availableMins}-minute window to honor tight schedule without skipping grounding movement.`;
  } else if (energy === 'very_low' || energy === 'low') {
    adapted.title = `Restorative Mobility & Gentle Stretch (${availableMins}m)`;
    adapted.intensity = 'gentle';
    adapted.exercises = [
      { name: 'Supported heart opener with bolster', durationMins: 5 },
      { name: 'Pelvic clocks & gentle windshield-wiper legs', durationMins: 8 },
      { name: 'Supine spinal twist with slow exhales', durationMins: 7 },
    ];
    adapted.adaptationReason = 'Softened intensity to honor reported low energy, preserving restorative parasympathetic tone.';
  } else if (availableMins >= 40) {
    adapted.title = `Deep Full-Body Strength & Flow (${availableMins}m)`;
    adapted.intensity = 'energizing';
    adapted.adaptationReason = 'Expanded workout to take advantage of high available time buffer.';
  }

  return adapted;
}
