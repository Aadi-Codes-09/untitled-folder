/**
 * MediKiosk — Advice & Medication Engine
 * Takes (conditionId, responses, redFlagCount) and returns:
 * 1. Triage level and clinical advice
 * 2. Detailed medication recommendations (dose, timing: before/after food, frequency, purpose, precautions)
 */

const TRIAGE = {
  EMERGENCY: { level: 'emergency', color: 'red',    label: { en: '🚨 Seek Emergency Care NOW', hi: '🚨 अभी आपातकालीन देखभाल लें' } },
  URGENT:    { level: 'urgent',    color: 'orange',  label: { en: '⚠️ See a Doctor Today',       hi: '⚠️ आज डॉक्टर से मिलें' } },
  ROUTINE:   { level: 'routine',   color: 'yellow',  label: { en: '📋 See a Doctor This Week',   hi: '📋 इस हफ्ते डॉक्टर से मिलें' } },
  SELFCARE:  { level: 'self-care', color: 'green',   label: { en: '✅ Home Care Recommended',     hi: '✅ घर पर देखभाल करें' } },
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getAnswer(responses, key) {
  const r = responses.find(r => r.questionKey === key)
  return r ? r.answer : null
}

function hasValue(responses, key, ...values) {
  const a = getAnswer(responses, key)
  if (!a) return false
  if (Array.isArray(a)) return values.some(v => a.includes(v))
  return values.includes(a)
}

function scaleValue(responses, key) {
  const a = getAnswer(responses, key)
  return typeof a === 'number' ? a : 0
}

// ─────────────────────────────────────────────
// Condition Medications Database
// ─────────────────────────────────────────────
export const MEDICATIONS_DATABASE = {
  fever: [
    {
      id: 'paracetamol',
      name: { en: 'Paracetamol 650mg (Dolo 650 / Calpol)', hi: 'पैरासिटामॉल 650mg (डोलो 650 / कालपोल)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet every 6–8 hours only if fever > 100°F (Max 3/day)', hi: 'बुखार 100°F से अधिक होने पर हर 6-8 घंटे में 1 गोली (दिन में अधिकतम 3)' },
      duration: { en: '3 days as needed', hi: '3 दिन (ज़रूरत पड़ने पर)' },
      purpose: { en: 'Lowers body temperature and relieves headache & body ache', hi: 'बुखार कम करता है और सिरदर्द व बदन दर्द में राहत देता है' },
      instructions: { en: 'Take with a full glass of water after meals. Never take on empty stomach.', hi: 'भोजन के बाद पूरे एक गिलास पानी के साथ लें। कभी खाली पेट न लें।' },
      precautions: { en: 'Do not exceed 3 tablets in 24 hours. Avoid alcohol. If fever > 3 days, see doctor.', hi: '24 घंटे में 3 गोली से अधिक न लें। शराब से बचें। 3 दिन बाद भी बुखार रहे तो डॉक्टर से मिलें।' },
      rxType: 'OTC',
    },
    {
      id: 'ors',
      name: { en: 'ORS (Oral Rehydration Salts)', hi: 'ओआरएस (इलेक्ट्रोलाइट घोल)' },
      form: { en: 'Powder Sachet (dissolve in 1L clean water)', hi: 'पाउडर सैशे (1 लीटर पानी में घोलें)' },
      timing: { en: 'Sip throughout the day', hi: 'दिनभर घूंट-घूंट करके पिएं' },
      timingType: 'throughout_day',
      schedule: { en: '1 to 2 liters daily', hi: 'रोज़ 1 से 2 लीटर' },
      duration: { en: 'During fever & recovery (3–5 days)', hi: 'बुखार और सुधार के दौरान (3-5 दिन)' },
      purpose: { en: 'Prevents dehydration and restores essential minerals lost through sweating', hi: 'पसीने से होने वाली पानी व ज़रूरी लवणों की कमी रोकता है' },
      instructions: { en: 'Dissolve 1 full packet in 1 liter clean drinking water. Drink within 24 hours.', hi: '1 पूरा पैकेट 1 लीटर स्वच्छ पानी में घोलें। 24 घंटे के अंदर पिएं।' },
      precautions: { en: 'Do not boil prepared solution. Keep covered and hygienic.', hi: 'घोल को उबालें नहीं। ढककर साफ जगह पर रखें।' },
      rxType: 'OTC',
    },
    {
      id: 'pantoprazole',
      name: { en: 'Pantoprazole 40mg (Pan 40)', hi: 'पैंटोप्राजोल 40mg (पैन 40)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Before breakfast (empty stomach)', hi: 'सुबह नाश्ते से 30 मिनट पहले (खाली पेट)' },
      timingType: 'before_food',
      schedule: { en: '1 tablet once daily in the morning', hi: 'रोज़ाना सुबह 1 गोली' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Protects the stomach lining from acidity and medicine irritation', hi: 'पेट में गैस, एसिडिटी और दवाओं से होने वाली जलन रोकता है' },
      instructions: { en: 'Swallow whole with water 30 minutes before morning tea/breakfast.', hi: 'सुबह की चाय/नाश्ते से आधा घंटा पहले पानी से साबुत निगलें।' },
      precautions: { en: 'Do not crush or chew the tablet.', hi: 'गोली को चबाएं या तोड़ें नहीं।' },
      rxType: 'OTC / Prescribed',
    },
  ],

  chest_pain: [
    {
      id: 'aspirin',
      name: { en: 'Aspirin 325mg (Disprin / Ecosprin)', hi: 'एस्पिरिन 325mg (डिस्प्रिन / इकोस्प्रिन)' },
      form: { en: 'Dispersible Tablet', hi: 'घुलनशील गोली' },
      timing: { en: 'IMMEDIATELY — Chew, do NOT swallow whole', hi: 'तुरंत — चबाकर खाएं, साबुत न निगलें' },
      timingType: 'sos',
      schedule: { en: 'Single emergency dose (1 tablet chewed)', hi: 'आपातकालीन एकल खुराक (1 गोली चबाएं)' },
      duration: { en: 'Immediate one-time emergency step', hi: 'आपातकालीन एक बार की खुराक' },
      purpose: { en: 'Blood thinner to prevent cardiac blood clot enlargement while awaiting emergency care', hi: 'खून को पतला कर दिल की नसों में थक्का बढ़ने से रोकता है' },
      instructions: { en: 'Chew thoroughly before swallowing for rapid absorption into blood. Call 108 immediately.', hi: 'तुरंत खून में असर के लिए अच्छी तरह चबाकर खाएं। तुरंत 108 पर कॉल करें।' },
      precautions: { en: 'DO NOT TAKE if you have an aspirin allergy, active stomach ulcer, or internal bleeding.', hi: 'यदि एस्पिरिन एलर्जी, पेट का अल्सर या अंदरूनी रक्तस्राव हो तो कतई न लें।' },
      rxType: 'Emergency First-Aid',
    },
    {
      id: 'sorbitrate',
      name: { en: 'Sorbitrate 5mg (Isosorbide Dinitrate)', hi: 'सोरबिट्रेट 5mg (जीभ के नीचे)' },
      form: { en: 'Sublingual Tablet', hi: 'सब्लिंगुअल (जीभ के नीचे)' },
      timing: { en: 'Keep under the tongue (Sublingual)', hi: 'जीभ के नीचे रखें' },
      timingType: 'sos',
      schedule: { en: '1 tablet under the tongue if previously advised by doctor', hi: 'यदि डॉक्टर द्वारा पहले सलाह दी गई हो तो 1 गोली जीभ के नीचे' },
      duration: { en: 'Emergency SOS', hi: 'आपातकालीन' },
      purpose: { en: 'Rapidly dilates heart arteries to relieve angina chest pain', hi: 'दिल की नसों को तुरंत चौड़ा कर सीने के दर्द में राहत देता है' },
      instructions: { en: 'Place under tongue and let it dissolve naturally. Sit down to avoid dizziness.', hi: 'जीभ के नीचे रखकर घुलने दें। चक्कर से बचने के लिए बैठकर ही लें।' },
      precautions: { en: 'May cause sudden blood pressure drop or headache. Use under medical supervision.', hi: 'बीपी अचानक कम हो सकता है। चिकित्सक की सलाह के अनुसार ही लें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'antacid_gel',
      name: { en: 'Antacid Gel 10ml (Digene / Gelusil)', hi: 'एंटासिड जेल 10ml (डाइजीन / जेलुसिल)' },
      form: { en: 'Liquid Suspension', hi: 'तरल सिरप' },
      timing: { en: 'After meals & bedtime', hi: 'भोजन के बाद और सोते समय' },
      timingType: 'after_food',
      schedule: { en: '2 teaspoons (10ml) as needed', hi: '2 चम्मच (10 मिली) ज़रूरत पड़ने पर' },
      duration: { en: '2–3 days', hi: '2-3 दिन' },
      purpose: { en: 'Relieves burning reflux / heartburn if chest pain is acid-related', hi: 'यदि सीने की जलन एसिडिटी के कारण हो तो तुरंत आराम देता है' },
      instructions: { en: 'Shake well before use. Do not drink water immediately after taking.', hi: 'इस्तेमाल से पहले अच्छी तरह हिलाएं। लेने के तुरंत बाद पानी न पिएं।' },
      precautions: { en: 'If chest pain spreads to left arm/jaw or sweating occurs, this is NOT acidity — call 108.', hi: 'यदि दर्द बांह या जबड़े में फैले तो यह गैस नहीं है, तुरंत 108 बुलाएं।' },
      rxType: 'OTC',
    },
  ],

  headache: [
    {
      id: 'paracetamol_500',
      name: { en: 'Paracetamol 500mg or Naproxen 250mg', hi: 'पैरासिटामॉल 500mg या नैप्रोक्सन 250mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food with water', hi: 'भोजन के बाद पानी के साथ' },
      timingType: 'after_food',
      schedule: { en: '1 tablet as needed (Max twice a day)', hi: 'ज़रूरत पड़ने पर 1 गोली (दिन में अधिकतम 2 बार)' },
      duration: { en: '1–2 days', hi: '1-2 दिन' },
      purpose: { en: 'Relieves tension headache, migraine throbbing, and sinus pressure', hi: 'तनाव सिरदर्द, माइग्रेन और माथे के भारीपन में तुरंत राहत देता है' },
      instructions: { en: 'Take after eating a snack or light meal. Rest in a dark, quiet room.', hi: 'हल्के नाश्ते के बाद लें। शांत व अंधेरे कमरे में विश्राम करें।' },
      precautions: { en: 'Avoid frequent daily use to prevent medication-overuse headaches.', hi: 'लगातार रोज़ लेने से बचें। यदि सिरदर्द अचानक बहुत तेज़ हो तो डॉक्टर से मिलें।' },
      rxType: 'OTC',
    },
    {
      id: 'domperidone',
      name: { en: 'Domperidone 10mg (Domstal)', hi: 'डोमपेरिडोन 10mg (डोमस्टाल)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: '15–30 minutes before food', hi: 'भोजन से 15-30 मिनट पहले' },
      timingType: 'before_food',
      schedule: { en: '1 tablet once or twice if nausea/vomiting is present', hi: 'उल्टी या जी मिचलाने पर 1 गोली' },
      duration: { en: 'As needed', hi: 'ज़रूरत पड़ने पर' },
      purpose: { en: 'Controls nausea, stomach heaviness, and vomiting associated with headache/migraine', hi: 'सिरदर्द के साथ होने वाली मतली और उल्टी को नियंत्रित करता है' },
      instructions: { en: 'Take with plain water before meals.', hi: 'खाने से पहले सादे पानी के साथ लें।' },
      precautions: { en: 'Do not take if heart rhythm irregularities exist.', hi: 'दिल की बीमारी होने पर डॉक्टर से पूछकर लें।' },
      rxType: 'OTC / Prescribed',
    },
  ],

  abdominal_pain: [
    {
      id: 'meftal_spas',
      name: { en: 'Dicyclomine + Mefenamic Acid (Meftal-Spas / Cyclopam)', hi: 'मेफ्टाल-स्पास / साइक्लोपाम' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Strictly after food', hi: 'हमेशा भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet when abdominal cramps occur (Max twice daily)', hi: 'पेट में मरोड़ होने पर 1 गोली (दिन में अधिकतम 2 बार)' },
      duration: { en: '1–2 days SOS', hi: '1-2 दिन (ज़रूरत पर)' },
      purpose: { en: 'Relieves smooth muscle spasms, intestinal cramps, and colicky pain', hi: 'पेट की आंतों की मरोड़, ऐंठन और दर्द को शांत करता है' },
      instructions: { en: 'Take with food or a glass of milk to prevent gastric irritation.', hi: 'पेट में जलन से बचने के लिए खाने के बाद या दूध के साथ लें।' },
      precautions: { en: 'Do NOT take if abdomen feels hard/rigid or if blood in stool is present.', hi: 'यदि पेट पत्थर जैसा कड़ा हो या शौच में खून हो तो दवा न लें, तुरंत अस्पताल जाएं।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'antacid_oral',
      name: { en: 'Antacid Suspension (Digene / Gelusil)', hi: 'एंटासिड सिरप (डाइजीन / जेलुसिल)' },
      form: { en: 'Suspension Liquid', hi: 'तरल सिरप' },
      timing: { en: 'After meals and at bedtime', hi: 'भोजन के 1 घंटे बाद और सोते समय' },
      timingType: 'after_food',
      schedule: { en: '10ml (2 teaspoons) 3 times daily', hi: '10ml (2 चम्मच) दिन में 3 बार' },
      duration: { en: '3 days', hi: '3 दिन' },
      purpose: { en: 'Neutralizes stomach hyperacidity, bloating, and burning sensation', hi: 'पेट की अतिरिक्त एसिडिटी, गैस और जलन को शांत करता है' },
      instructions: { en: 'Shake well before taking. Do not drink water right after.', hi: 'पीने से पहले अच्छी तरह हिलाएं।' },
      precautions: { en: 'Space other medicines by at least 2 hours as antacids reduce absorption.', hi: 'अन्य दवाओं और इसके बीच कम से कम 2 घंटे का अंतर रखें।' },
      rxType: 'OTC',
    },
  ],

  breathing: [
    {
      id: 'salbutamol',
      name: { en: 'Salbutamol Inhaler 100mcg (Asthalin)', hi: 'साल्बुटामोल इनहेलर (अस्थालिन 100mcg)' },
      form: { en: 'Metered Dose Inhaler', hi: 'इनहेलर पफ' },
      timing: { en: 'Immediate SOS when wheezing/breathless', hi: 'सांस फूलने या घरघराहट होने पर तुरंत' },
      timingType: 'sos',
      schedule: { en: '2 puffs via spacer or directly into mouth', hi: '2 पफ (आवश्यकतानुसार)' },
      duration: { en: 'As needed for acute wheeze', hi: 'आपातकालीन ज़रूरत पर' },
      purpose: { en: 'Rapidly relaxes airway muscles to restore normal breathing', hi: 'सांस की नलियों को तुरंत खोलकर सांस लेना आसान बनाता है' },
      instructions: { en: 'Shake inhaler, exhale fully, seal lips on mouthpiece, inhale deeply while pressing puff, hold breath for 10s.', hi: 'इनहेलर हिलाएं, पूरी सांस छोड़ें, पफ दबाते हुए गहरी सांस अंदर खींचे और 10 सेकंड रोकें।' },
      precautions: { en: 'If breathing does not improve after 4 puffs, seek emergency care immediately.', hi: '4 पफ के बाद भी आराम न मिले तो तुरंत अस्पताल जाएं।' },
      rxType: 'Prescription Guidance',
    },
    {
      id: 'montair_lc',
      name: { en: 'Montelukast 10mg + Levocetirizine 5mg (Montair-LC)', hi: 'मोंटेलुकास्ट + लेवोसिटिरिज़िन (मोंटेयर-एलसी)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At night after dinner', hi: 'रात को भोजन के बाद सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at bedtime', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '5–7 days', hi: '5 से 7 दिन' },
      purpose: { en: 'Reduces airway allergies, night coughing, and bronchial inflammation', hi: 'रात की खांसी, सांस की नली की एलर्जी और सूजन को कम करता है' },
      instructions: { en: 'Take after dinner with water.', hi: 'रात के खाने के बाद पानी से लें।' },
      precautions: { en: 'May cause mild drowsiness. Do not drive or operate machinery at night.', hi: 'हल्की नींद आ सकती है, रात में ड्राइविंग से बचें।' },
      rxType: 'Prescription Guidance',
    },
  ],

  cough: [
    {
      id: 'cough_syrup',
      name: { en: 'Dextromethorphan + Chlorpheniramine Syrup (Dry Cough) or Ambroxol Syrup (Wet Cough)', hi: 'कफ सिरप (सूखी खांसी के लिए डेक्सट्रोमेथॉर्फ़न / बलगम के लिए एम्ब्रोक्सोल)' },
      form: { en: 'Syrup', hi: 'सिरप' },
      timing: { en: 'After food with lukewarm water', hi: 'भोजन के बाद गुनगुने पानी के साथ' },
      timingType: 'after_food',
      schedule: { en: '10ml (2 teaspoons) thrice daily', hi: '10ml (2 चम्मच) दिन में 3 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Soothes throat reflex and thins sticky mucus for easy expulsion', hi: 'गले की खराश शांत करता है और बलगम को पतला कर बाहर निकालता है' },
      instructions: { en: 'Take with warm water. Avoid cold drinks, ice, and smoking.', hi: 'गुनगुने पानी से लें। ठंडे पानी, बर्फ और सिगरेट से परहेज करें।' },
      precautions: { en: 'If blood appears in phlegm or cough lasts > 3 weeks, consult a physician for TB/chest X-ray.', hi: 'यदि बलगम में खून आए या 3 हफ्ते से अधिक खांसी रहे तो तुरंत डॉक्टर से टीबी/एक्स-रे करवाएं।' },
      rxType: 'OTC',
    },
    {
      id: 'gargle',
      name: { en: 'Warm Salt Water Gargle & Honey Lozenges', hi: 'गुनगुने नमक पानी के गरारे व शहद' },
      form: { en: 'Home remedy / Gargle', hi: 'गरारे / घरेलू उपचार' },
      timing: { en: 'Morning, evening & before sleep', hi: 'सुबह, शाम और सोने से पहले' },
      timingType: 'throughout_day',
      schedule: { en: '3 to 4 times daily', hi: 'दिन में 3 से 4 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Natural antibacterial and soothing agent for inflamed vocal cords and throat', hi: 'गले की सूजन और खराश को प्राकृतिक रूप से ठीक करता है' },
      instructions: { en: 'Dissolve half teaspoon salt in warm water, gargle for 60 seconds and spit out.', hi: 'आधा चम्मच नमक गुनगुने पानी में घोलकर गरारे करें।' },
      precautions: { en: 'Do not swallow salty water.', hi: 'नमक का पानी निगलें नहीं।' },
      rxType: 'Home Care',
    },
  ],

  joint_pain: [
    {
      id: 'zerodol_p',
      name: { en: 'Aceclofenac 100mg + Paracetamol 325mg (Zerodol-P)', hi: 'एसेक्लोफेनाक + पैरासिटामॉल (ज़ीरोडोल-पी)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Strictly after food with milk or meal', hi: 'हमेशा भोजन या दूध के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily (morning & night)', hi: 'दिन में 2 बार (सुबह और रात भोजन के बाद)' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Reduces joint inflammation, stiffness, and severe swelling', hi: 'जोड़ों की सूजन, अकड़न और दर्द को तेज़ी से कम करता है' },
      instructions: { en: 'Always take after eating food. Never take on empty stomach to protect stomach.', hi: 'पेट की सुरक्षा के लिए हमेशा खाना खाने के बाद ही लें।' },
      precautions: { en: 'Avoid if you have kidney disease, heart failure, or active stomach ulcer.', hi: 'किडनी रोग, दिल की बीमारी या अल्सर होने पर न लें।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'volini_gel',
      name: { en: 'Diclofenac Topical Gel (Volini / Omnigel)', hi: 'डाइक्लोफेनाक दर्द निवारक जेल (वोलिनी / ओम्नीजेल)' },
      form: { en: 'Topical Gel', hi: 'दर्द निवारक जेल' },
      timing: { en: 'Apply 3 times daily gently', hi: 'दिन में 3 बार हल्के हाथों से लगाएं' },
      timingType: 'throughout_day',
      schedule: { en: 'Apply gently over painful joint; do NOT rub vigorously', hi: 'दर्द वाली जगह पर हल्के हाथ से फैलाएं, तेज़ मालिश न करें' },
      duration: { en: '5–7 days', hi: '5 से 7 दिन' },
      purpose: { en: 'Direct localized transdermal pain relief without stomach side effects', hi: 'बिना किसी पेट के दुष्प्रभाव के सीधे जोड़ के दर्द में राहत देता है' },
      instructions: { en: 'Wash hands before and after applying. Do not apply on broken or cut skin.', hi: 'लगाने के बाद हाथ धो लें। कटी हुई त्वचा पर न लगाएं।' },
      precautions: { en: 'Do not wrap tight bandages or apply hot water bottle immediately after gel.', hi: 'जेल लगाने के तुरंत बाद गर्म पानी की सिकाई न करें।' },
      rxType: 'OTC',
    },
  ],

  back_pain: [
    {
      id: 'zerodol_th',
      name: { en: 'Aceclofenac + Thiocolchicoside (Zerodol-TH 4 / 8)', hi: 'एसेक्लोफेनाक + थायोकोल्चिकोसाइड (मांसपेशी शिथिलक)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Strictly after food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily after meals', hi: 'दिन में 2 बार भोजन के बाद' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Relaxes painful back muscle spasms and reduces spinal inflammation', hi: 'कमर की मांसपेशियों की ऐंठन खोलता है और रीढ़ की सूजन घटाता है' },
      instructions: { en: 'Take with a glass of water after food. Maintain good sitting posture.', hi: 'खाना खाने के बाद लें। झुककर भारी सामान न उठाएं।' },
      precautions: { en: 'If numbness in legs or loss of bladder control occurs, go to emergency immediately.', hi: 'यदि पैरों में सुन्नपन या पेशाब पर नियंत्रण न रहे तो तुरंत आपातकाल जाएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'heat_pack',
      name: { en: 'Hot Fermentation / Warm Compress', hi: 'गर्म पानी की थैली से सिकाई' },
      form: { en: 'Physical Therapy', hi: 'सिकाई (थेरेपी)' },
      timing: { en: 'Twice daily for 15–20 minutes', hi: 'दिन में 2 बार 15-20 मिनट' },
      timingType: 'throughout_day',
      schedule: { en: 'Morning & evening before sleeping', hi: 'सुबह और शाम' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Increases blood flow to back muscles and speeds healing', hi: 'कमर की मांसपेशियों में रक्त संचार बढ़ाकर जकड़न दूर करता है' },
      instructions: { en: 'Use warm water pack with a cloth wrap. Do not use scalding water.', hi: 'गर्म पानी की थैली को कपड़े में लपेटकर सिकाई करें।' },
      precautions: { en: 'Do not use heat if back pain resulted from an acute fall or direct blow in last 24h.', hi: 'ताज़ा चोट या गिरने के तुरंत बाद बर्फ लगाएं, गर्म सिकाई न करें।' },
      rxType: 'Home Care',
    },
  ],

  skin_rash: [
    {
      id: 'cetirizine',
      name: { en: 'Cetirizine 10mg or Levocetirizine 5mg (Cetzine / 1-AL)', hi: 'सिटिरिज़िन 10mg / लेवोसिटिरिज़िन 5mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At bedtime after food', hi: 'रात को भोजन के बाद सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at night', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Blocks histamine to stop itching, hives, and skin allergic swelling', hi: 'एलर्जी, खुजली और त्वचा पर लाल चकत्तों को रोकता है' },
      instructions: { en: 'Take at night. Keep nails trimmed to prevent scratching skin infection.', hi: 'रात को लें। त्वचा पर नाखून न लगाएं।' },
      precautions: { en: 'Causes drowsiness. Do not drive or consume alcohol.', hi: 'सुस्ती आ सकती है, इसलिए रात को ही लें और गाड़ी न चलाएं।' },
      rxType: 'OTC',
    },
    {
      id: 'calamine',
      name: { en: 'Calamine Lotion (Lacto Calamine)', hi: 'कैलामाइन लोशन' },
      form: { en: 'Topical Lotion', hi: 'लोशन' },
      timing: { en: 'Apply 2–3 times daily', hi: 'दिन में 2 से 3 बार लगाएं' },
      timingType: 'throughout_day',
      schedule: { en: 'Dab gently on itchy skin with cotton', hi: 'रुई की मदद से खुजली वाले स्थान पर लगाएं' },
      duration: { en: 'Until rash resolves', hi: 'दाने ठीक होने तक' },
      purpose: { en: 'Provides cooling relief and protects irritated skin barrier', hi: 'त्वचा को ठंडक पहुंचाता है और जलन शांत करता है' },
      instructions: { en: 'Shake bottle well. Apply gently on affected clean skin.', hi: 'शीशी अच्छी तरह हिलाकर लगाएं।' },
      precautions: { en: 'For external use only. Avoid contact with eyes.', hi: 'केवल बाहरी उपयोग के लिए है। आँखों से दूर रखें।' },
      rxType: 'OTC',
    },
  ],

  dizziness: [
    {
      id: 'betahistine',
      name: { en: 'Betahistine 16mg (Vertin 16)', hi: 'बीटाहीस्टीन 16mg (वर्टिन 16)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily (morning & night)', hi: 'दिन में 2 बार (सुबह और रात)' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Improves microcirculation in the inner ear to stop vertigo spinning sensation', hi: 'कान के अंदरूनी हिस्से में रक्त प्रवाह सुधारकर चक्कर आना बंद करता है' },
      instructions: { en: 'Take with or after food. Avoid sudden head movements.', hi: 'खाने के बाद लें। अचानक सिर न घुमाएं।' },
      precautions: { en: 'Consult a doctor if dizziness is accompanied by slurred speech or facial droop.', hi: 'यदि बोलने में लड़खड़ाहट या चेहरे में कमज़ोरी हो तो तुरंत अस्पताल जाएं।' },
      rxType: 'Prescription Guidance',
    },
  ],

  diabetes: [
    {
      id: 'electrolyte_sugarfree',
      name: { en: 'Sugar-Free Electrolytes & Hydration Fluid', hi: 'शुगर-फ्री इलेक्ट्रोलाइट्स व पानी' },
      form: { en: 'Liquid / Sachet', hi: 'तरल पदार्थ' },
      timing: { en: 'Throughout the day', hi: 'दिनभर पिएं' },
      timingType: 'throughout_day',
      schedule: { en: 'Drink 2.5 to 3 liters of water daily', hi: 'रोज़ 2.5 से 3 लीटर पानी पिएं' },
      duration: { en: 'Daily habit', hi: 'नियमित आदत' },
      purpose: { en: 'Replaces fluid loss from frequent urination and protects kidneys', hi: 'बार-बार पेशाब आने से होने वाली पानी की कमी रोकता है और किडनी सुरक्षित रखता है' },
      instructions: { en: 'Do not add sugar or sweetened syrups. Plain water, clear vegetable broth, lemon water.', hi: 'चीनी या मीठे पेय न लें। सादा पानी, नींबू पानी या पतला सूप लें।' },
      precautions: { en: 'If blood sugar drops below 70 mg/dL (shaking, cold sweat), take 3 spoons sugar immediately.', hi: 'यदि शुगर 70 से कम हो (कंपकंपी, ठंडा पसीना), तो तुरंत 3 चम्मच चीनी या मीठा खाएं।' },
      rxType: 'Daily Management',
    },
  ],

  urinary: [
    {
      id: 'citralka',
      name: { en: 'Disodium Hydrogen Citrate Syrup (Citralka / Alkasol)', hi: 'सिट्राल्का सिरप (पेशाब की जलन के लिए)' },
      form: { en: 'Syrup Solution', hi: 'सिरप' },
      timing: { en: 'After meals mixed in a full glass of water', hi: 'भोजन के बाद 1 पूरे गिलास पानी में मिलाकर' },
      timingType: 'after_food',
      schedule: { en: '15ml (3 teaspoons) in a glass of water, 3 times daily', hi: '15 मिली (3 चम्मच) पूरे गिलास पानी में, दिन में 3 बार' },
      duration: { en: '3 to 5 days', hi: '3 से 5 दिन' },
      purpose: { en: 'Alkalinizes acidic urine to immediately soothe painful burning sensation', hi: 'पेशाब के एसिड को सामान्य कर तुरंत जलन शांत करता है' },
      instructions: { en: 'ALWAYS dilute in a full glass of water. Drink 3 to 4 liters of water daily.', hi: 'हमेशा पूरे गिलास पानी में घोलकर पिएं। दिनभर में 3-4 लीटर पानी पिएं।' },
      precautions: { en: 'If blood appears in urine or high fever with chills occurs, seek doctor immediately.', hi: 'यदि पेशाब में खून आए या ठंड लगकर बुखार हो तो तुरंत डॉक्टर को दिखाएं।' },
      rxType: 'OTC',
    },
  ],

  mental_health: [
    {
      id: 'ashwagandha',
      name: { en: 'Ashwagandha Extract (300mg) & Chamomile Tea', hi: 'अश्वगंधा चूर्ण / कैमोमाइल चाय' },
      form: { en: 'Herbal Supplement / Tea', hi: 'हर्बल सप्लीमेंट / चाय' },
      timing: { en: 'At night 30 minutes before sleep', hi: 'रात को सोने से 30 मिनट पहले' },
      timingType: 'bedtime',
      schedule: { en: 'Once daily at bedtime', hi: 'रोज़ाना रात में 1 बार' },
      duration: { en: '15–30 days', hi: '15 से 30 दिन' },
      purpose: { en: 'Lowers cortisol, calms hyperactive thoughts, and promotes deep restorative sleep', hi: 'तनाव हार्मोन कम करता है, मन शांत करता है और गहरी नींद लाता है' },
      instructions: { en: 'Take with warm milk or lukewarm water before bedtime. Practice deep breathing.', hi: 'हल्के गुनगुने दूध या पानी के साथ लें। गहरी सांस लेने का अभ्यास करें।' },
      precautions: { en: 'If experiencing severe hopelessness or self-harm thoughts, call free helpline: 9152987821.', hi: 'यदि खुद को नुकसान पहुंचाने के विचार आएं तो तुरंत निःशुल्क हेल्पलाइन 9152987821 पर बात करें।' },
      rxType: 'Natural Support',
    },
  ],

  fatigue: [
    {
      id: 'becadexamin',
      name: { en: 'Multivitamin + Minerals with Zinc & B-Complex (Becadexamin / Supradyn)', hi: 'मल्टीविटामिन व मिनरल्स (सुप्राडिन / बिकाडेक्सामिन)' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'Once daily after lunch', hi: 'रोज़ दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 capsule daily after a substantial meal', hi: 'रोज़ दोपहर के भोजन के बाद 1 कैप्सूल' },
      duration: { en: '15 to 30 days', hi: '15 से 30 दिन' },
      purpose: { en: 'Restores essential vitamins, iron, and minerals to boost cellular energy and stamina', hi: 'शरीर में पोषक तत्वों की कमी पूरी कर ऊर्जा, खून और ताकत बढ़ाता है' },
      instructions: { en: 'Take with water after lunch. Maintain a protein-rich diet (lentils, milk, sprouts).', hi: 'दोपहर के खाने के बाद पानी से लें। दाल, दूध, फल और पौष्टिक आहार लें।' },
      precautions: { en: 'Do not take on empty stomach to avoid mild nausea.', hi: 'खाली पेट न लें ताकि मतली न हो।' },
      rxType: 'OTC',
    },
  ],

  eye_problems: [
    {
      id: 'lubricant_drops',
      name: { en: 'Lubricant Eye Drops (Carboxymethylcellulose 0.5% - Refresh Tears)', hi: 'आँखों की लुब्रिकेंट ड्रॉप्स (रिफ्रेश टियर्स)' },
      form: { en: 'Sterile Eye Drops', hi: 'आई ड्रॉप्स' },
      timing: { en: 'Apply 3–4 times daily as needed', hi: 'दिन में 3 से 4 बार आवश्यकतानुसार' },
      timingType: 'throughout_day',
      schedule: { en: '1–2 drops in both eyes', hi: 'दोनों आँखों में 1-2 बूंद' },
      duration: { en: '5–7 days', hi: '5 से 7 दिन' },
      purpose: { en: 'Soothes eye redness, dryness, computer strain, and burning sensation', hi: 'आँखों की जलन, सूखापन, लाली और थकान को तुरंत शांत करता है' },
      instructions: { en: 'Do not touch the dropper tip to eye surface. Keep cap clean.', hi: 'ड्रॉपर की नोक को आँख या उंगली से न छुएं। ढक्कन साफ रखें।' },
      precautions: { en: 'If sudden loss of vision, severe pain, or colored halos appear, visit eye doctor immediately.', hi: 'यदि रोशनी अचानक कम हो या तेज़ दर्द हो तो तुरंत नेत्र विशेषज्ञ से मिलें।' },
      rxType: 'OTC',
    },
  ],

  // ── Extended conditions ──
  palpitations: [
    {
      id: 'metoprolol',
      name: { en: 'Metoprolol Succinate ER 25mg (Metolar-XR)', hi: 'मेटोप्रोलोल 25mg (मेटोलार-XR)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After breakfast (morning)', hi: 'नाश्ते के बाद (सुबह)' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily in the morning', hi: 'रोज़ाना सुबह 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Slows rapid heartbeat and controls palpitation episodes', hi: 'तेज़ धड़कन को सामान्य करता है और घबराहट के दौरे रोकता है' },
      instructions: { en: 'Take at the same time daily. Do not stop suddenly.', hi: 'रोज़ एक ही समय पर लें। अचानक बंद न करें।' },
      precautions: { en: 'If chest pain with sweating or fainting occurs, call 108 immediately.', hi: 'पसीने के साथ सीने में दर्द या बेहोशी हो तो तुरंत 108 बुलाएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'palp_magnesium',
      name: { en: 'Magnesium Glycinate 250mg', hi: 'मैग्नीशियम ग्लाइसिनेट 250mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At bedtime', hi: 'सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at night', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Stabilizes heart rhythm and reduces anxiety-linked palpitations', hi: 'दिल की धड़कन स्थिर करता है और चिंता से होने वाली घबराहट कम करता है' },
      instructions: { en: 'Take with water before sleep. Limit tea/coffee.', hi: 'सोने से पहले पानी से लें। चाय/कॉफी कम करें।' },
      precautions: { en: 'Avoid excess caffeine, alcohol and smoking.', hi: 'कैफीन, शराब और धूम्रपान से बचें।' },
      rxType: 'OTC',
    },
  ],

  hypertension: [
    {
      id: 'telmisartan',
      name: { en: 'Telmisartan 40mg (Telma)', hi: 'टेल्मिसार्टन 40mg (टेल्मा)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Every morning (same time)', hi: 'रोज़ सुबह (एक ही समय)' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Lowers high blood pressure and protects heart & kidneys', hi: 'हाई ब्लड प्रेशर कम करता है और दिल व किडनी की रक्षा करता है' },
      instructions: { en: 'Take daily without skipping. Measure BP twice a week and note readings.', hi: 'बिना नागा रोज़ लें। हफ्ते में दो बार बीपी नापकर लिखें।' },
      precautions: { en: 'If BP exceeds 180/110 with headache or breathlessness, seek emergency care.', hi: 'बीपी 180/110 से ऊपर जाए और सिरदर्द या सांस फूले तो आपातकाल जाएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'bp_amlodipine',
      name: { en: 'Amlodipine 5mg (Amlong)', hi: 'एम्लोडिपिन 5mg (एम्लॉन्ग)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Morning after breakfast', hi: 'सुबह नाश्ते के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Relaxes blood vessels to keep BP in normal range', hi: 'खून की नसों को ढीला कर बीपी सामान्य रखता है' },
      instructions: { en: 'Reduce salt intake. Walk 30 minutes daily.', hi: 'नमक कम खाएं। रोज़ 30 मिनट टहलें।' },
      precautions: { en: 'May cause ankle swelling — inform your doctor if severe.', hi: 'टखनों में सूजन हो सकती है — ज़्यादा हो तो डॉक्टर को बताएं।' },
      rxType: 'Prescription Only',
    },
  ],

  asthma: [
    {
      id: 'asthma_foracort',
      name: { en: 'Foracort 200 Inhaler (Budesonide + Formoterol)', hi: 'फोराकोर्ट 200 इनहेलर' },
      form: { en: 'Metered Dose Inhaler', hi: 'इनहेलर पफ' },
      timing: { en: 'Morning & night with spacer', hi: 'सुबह और रात स्पेसर के साथ' },
      timingType: 'throughout_day',
      schedule: { en: '2 puffs twice daily', hi: 'दिन में 2 बार 2 पफ' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Daily controller that prevents asthma attacks and airway swelling', hi: 'रोज़ाना की दवा जो दमा के दौरे और नली की सूजन रोकती है' },
      instructions: { en: 'Rinse mouth after use. Never skip even when feeling well.', hi: 'इस्तेमाल के बाद कुल्ला करें। अच्छा लगने पर भी बंद न करें।' },
      precautions: { en: 'Keep Asthalin rescue inhaler always with you.', hi: 'अस्थालिन राहत इनहेलर हमेशा साथ रखें।' },
      rxType: 'Prescription Guidance',
    },
    {
      id: 'asthma_montair',
      name: { en: 'Montelukast + Levocetirizine (Montair-LC)', hi: 'मोंटेयर-एलसी गोली' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At night after dinner', hi: 'रात को भोजन के बाद' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at bedtime', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Controls allergy-triggered wheezing and night cough', hi: 'एलर्जी से होने वाली घरघराहट और रात की खांसी रोकता है' },
      instructions: { en: 'Take after dinner with water.', hi: 'रात के खाने के बाद पानी से लें।' },
      precautions: { en: 'Avoid dust, smoke, incense and pets triggering attacks.', hi: 'धूल, धुआं, अगरबत्ती और पालतू जानवरों से बचें।' },
      rxType: 'Prescription Guidance',
    },
  ],

  common_cold: [
    {
      id: 'cold_cetzine',
      name: { en: 'Levocetirizine 5mg (1-AL)', hi: 'लेवोसिटिरिज़िन 5mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At bedtime', hi: 'सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at night', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Stops sneezing, runny nose and watery eyes', hi: 'छींक, बहती नाक और आंखों से पानी बंद करता है' },
      instructions: { en: 'Take at night. Drink warm fluids through the day.', hi: 'रात को लें। दिनभर गुनगुने पेय पिएं।' },
      precautions: { en: 'Causes drowsiness — avoid driving at night.', hi: 'नींद आ सकती है — रात में गाड़ी न चलाएं।' },
      rxType: 'OTC',
    },
    {
      id: 'cold_nasal',
      name: { en: 'Xylometazoline Nasal Drops 0.05% (Otrivin)', hi: 'नाक की ड्रॉप्स (ओट्रिविन)' },
      form: { en: 'Nasal Drops', hi: 'नाक की बूंदें' },
      timing: { en: 'Morning & night', hi: 'सुबह और रात' },
      timingType: 'throughout_day',
      schedule: { en: '2 drops per nostril twice daily', hi: 'दोनों नथुनों में 2-2 बूंद दिन में 2 बार' },
      duration: { en: 'Max 5 days', hi: 'अधिकतम 5 दिन' },
      purpose: { en: 'Opens blocked nose for easy breathing', hi: 'बंद नाक खोलकर सांस लेना आसान बनाता है' },
      instructions: { en: 'Do not share the bottle. Blow nose gently before use.', hi: 'बोतल साझा न करें। इस्तेमाल से पहले नाक हल्के से साफ करें।' },
      precautions: { en: 'Do not use beyond 5 days — congestion may worsen.', hi: '5 दिन से ज़्यादा न डालें — नाक और बंद हो सकती है।' },
      rxType: 'OTC',
    },
  ],

  vertigo: [
    {
      id: 'vertigo_betahistine',
      name: { en: 'Betahistine 24mg (Vertin 24)', hi: 'बीटाहीस्टीन 24mg (वर्टिन 24)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Restores inner-ear balance to stop spinning vertigo', hi: 'कान के संतुलन को ठीक कर घूमता चक्कर बंद करता है' },
      instructions: { en: 'Take after meals. Get up slowly from bed or chair.', hi: 'खाने के बाद लें। बिस्तर से धीरे उठें।' },
      precautions: { en: 'If vertigo comes with double vision or slurred speech, go to emergency.', hi: 'दोहरी दृष्टि या लड़खड़ाती बोली के साथ चक्कर हो तो आपातकाल जाएं।' },
      rxType: 'Prescription Guidance',
    },
    {
      id: 'vertigo_stugeron',
      name: { en: 'Cinnarizine + Dimenhydrinate (Stugeron Plus)', hi: 'स्टुजेरॉन प्लस गोली' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'At bedtime', hi: 'सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 tablet once daily at night', hi: 'रोज़ाना रात में 1 गोली' },
      duration: { en: '7 days', hi: '7 दिन' },
      purpose: { en: 'Prevents motion-type dizziness and nausea', hi: 'घूमने-जैसा चक्कर और जी मिचलाना रोकता है' },
      instructions: { en: 'Take at night with water.', hi: 'रात को पानी से लें।' },
      precautions: { en: 'May cause sleepiness — avoid driving.', hi: 'नींद आ सकती है — गाड़ी न चलाएं।' },
      rxType: 'Prescription Guidance',
    },
  ],

  seizure: [
    {
      id: 'seizure_valproate',
      name: { en: 'Sodium Valproate Chrono 300mg (Encorate)', hi: 'सोडियम वैल्प्रोएट 300mg (एनकोरेट)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food (morning & night)', hi: 'भोजन के बाद (सुबह और रात)' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily — never miss a dose', hi: 'दिन में 2 बार — एक भी खुराक न छोड़ें' },
      duration: { en: '30 days (long-term)', hi: '30 दिन (लंबे समय तक)' },
      purpose: { en: 'Prevents seizure episodes by calming abnormal brain activity', hi: 'मस्तिष्क की असामान्य गतिविधि शांत कर दौरे रोकता है' },
      instructions: { en: 'Take strictly on time. Keep a seizure diary with date and duration.', hi: 'बिल्कुल समय पर लें। दौरे की तारीख व अवधि डायरी में लिखें।' },
      precautions: { en: 'If a seizure lasts more than 5 minutes, call 108. Do not put anything in the mouth.', hi: '5 मिनट से लंबा दौरा हो तो 108 बुलाएं। मुंह में कुछ न डालें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'seizure_folic',
      name: { en: 'Folic Acid 5mg (Folvite)', hi: 'फोलिक एसिड 5mg (फोल्वाइट)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Morning', hi: 'सुबह' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Protects against vitamin deficiency caused by seizure medicines', hi: 'दौरे की दवाओं से होने वाली विटामिन कमी से बचाता है' },
      instructions: { en: 'Take in the morning with water.', hi: 'सुबह पानी से लें।' },
      precautions: { en: 'Avoid alcohol completely. A neurology review with EEG is essential.', hi: 'शराब पूरी तरह बंद करें। EEG के साथ न्यूरोलॉजिस्ट से मिलना ज़रूरी है।' },
      rxType: 'OTC',
    },
  ],

  neck_pain: [
    {
      id: 'neck_zerodol',
      name: { en: 'Aceclofenac + Paracetamol (Zerodol-P)', hi: 'ज़ीरोडोल-पी गोली' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Strictly after food', hi: 'हमेशा भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Relieves neck stiffness, pain and nerve compression ache', hi: 'गर्दन की अकड़न, दर्द और नसों के दबाव में राहत देता है' },
      instructions: { en: 'Take after food. Do neck rotation exercises gently twice daily.', hi: 'खाने के बाद लें। गर्दन के हल्के व्यायाम दिन में 2 बार करें।' },
      precautions: { en: 'If pain shoots into arms with numbness, see an orthopedic doctor soon.', hi: 'दर्द बांहों में झनझनाहट के साथ जाए तो हड्डी रोग विशेषज्ञ से मिलें।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'neck_shelcal',
      name: { en: 'Calcium + Vitamin D3 (Shelcal 500)', hi: 'शेल्काल (कैल्शियम + D3)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After lunch', hi: 'दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Strengthens cervical bones and prevents spondylosis worsening', hi: 'गर्दन की हड्डियां मज़बूत करता है और सर्वाइकल बढ़ने से रोकता है' },
      instructions: { en: 'Sit straight. Avoid sleeping on high pillows.', hi: 'सीधे बैठें। ऊंचे तकिए पर न सोएं।' },
      precautions: { en: 'Avoid lifting heavy weights on head or shoulders.', hi: 'सिर या कंधों पर भारी वज़न न उठाएं।' },
      rxType: 'OTC',
    },
  ],

  muscle_pain: [
    {
      id: 'muscle_zerodol',
      name: { en: 'Aceclofenac + Paracetamol (Zerodol-P)', hi: 'ज़ीरोडोल-पी गोली' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Strictly after food', hi: 'हमेशा भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Reduces muscle inflammation, spasm and body ache', hi: 'मांसपेशियों की सूजन, ऐंठन और बदन दर्द कम करता है' },
      instructions: { en: 'Take after meals with water. Apply warm compress on painful muscles.', hi: 'खाने के बाद पानी से लें। दर्द वाली जगह गर्म सिकाई करें।' },
      precautions: { en: 'If urine turns dark brown with severe muscle pain, seek care urgently.', hi: 'तेज़ दर्द के साथ पेशाब गहरा भूरा हो तो तुरंत डॉक्टर से मिलें।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'muscle_volini',
      name: { en: 'Diclofenac Gel (Volini / Omnigel)', hi: 'वोलिनी दर्द निवारक जेल' },
      form: { en: 'Topical Gel', hi: 'दर्द निवारक जेल' },
      timing: { en: 'Apply 3 times daily', hi: 'दिन में 3 बार लगाएं' },
      timingType: 'throughout_day',
      schedule: { en: 'Apply gently over painful muscles', hi: 'दर्द वाली मांसपेशी पर हल्के से लगाएं' },
      duration: { en: '10 days', hi: '10 दिन' },
      purpose: { en: 'Direct pain relief at the muscle without stomach side effects', hi: 'बिना पेट पर असर के सीधे मांसपेशी के दर्द में राहत' },
      instructions: { en: 'Wash hands after applying. Do not apply on cuts.', hi: 'लगाने के बाद हाथ धोएं। कटी त्वचा पर न लगाएं।' },
      precautions: { en: 'Do not bandage tightly over the gel.', hi: 'जेल के ऊपर कसकर पट्टी न बांधें।' },
      rxType: 'OTC',
    },
  ],

  flu: [
    {
      id: 'flu_antiviral',
      name: { en: 'Oseltamivir 75mg (Fluvir)', hi: 'ओसेल्टामिविर 75mg (फ्लूविर)' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 capsule twice daily for 5 days', hi: '5 दिन तक दिन में 2 बार 1 कैप्सूल' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Antiviral that shortens flu duration and reduces complications', hi: 'फ्लू की अवधि घटाता है और जटिलताएं रोकता है' },
      instructions: { en: 'Start within 48 hours of symptoms. Complete the full 5-day course.', hi: 'लक्षणों के 48 घंटे के अंदर शुरू करें। पूरा 5 दिन का कोर्स करें।' },
      precautions: { en: 'Stay isolated for 5 days. If breathing worsens, go to hospital.', hi: '5 दिन अलग रहें। सांस बिगड़े तो अस्पताल जाएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'flu_paracetamol',
      name: { en: 'Paracetamol 650mg (Dolo 650)', hi: 'पैरासिटामॉल 650mg (डोलो 650)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet every 6–8 hours if fever (Max 3/day)', hi: 'बुखार पर हर 6-8 घंटे में 1 गोली (अधिकतम 3)' },
      duration: { en: '4 days as needed', hi: '4 दिन (ज़रूरत पर)' },
      purpose: { en: 'Controls fever, headache and body ache of flu', hi: 'फ्लू के बुखार, सिरदर्द और बदन दर्द में राहत' },
      instructions: { en: 'Take with water after meals. Drink ORS alongside.', hi: 'खाने के बाद पानी से लें। साथ में ORS पिएं।' },
      precautions: { en: 'Do not exceed 3 tablets in 24 hours.', hi: '24 घंटे में 3 गोली से अधिक न लें।' },
      rxType: 'OTC',
    },
  ],

  dehydration: [
    {
      id: 'dehy_ors',
      name: { en: 'ORS Sachets (Electral)', hi: 'ओआरएस घोल (इलेक्ट्राल)' },
      form: { en: 'Powder Sachet (1L water each)', hi: 'पाउडर सैशे (1 लीटर पानी में)' },
      timing: { en: 'Sip frequently all day', hi: 'दिनभर बार-बार घूंट पिएं' },
      timingType: 'throughout_day',
      schedule: { en: '2–3 liters of prepared solution daily', hi: 'रोज़ 2-3 लीटर तैयार घोल' },
      duration: { en: '3 days', hi: '3 दिन' },
      purpose: { en: 'Rapidly replaces water and salts lost from the body', hi: 'शरीर से निकले पानी व लवणों की तेज़ भरपाई करता है' },
      instructions: { en: 'Dissolve 1 sachet per litre of clean water. Use within 24 hours.', hi: '1 सैशे 1 लीटर साफ पानी में घोलें। 24 घंटे में इस्तेमाल करें।' },
      precautions: { en: 'If no urine for 8 hours or extreme weakness, go to hospital for IV fluids.', hi: '8 घंटे पेशाब न आए या बहुत कमज़ोरी हो तो अस्पताल में ड्रिप लगवाएं।' },
      rxType: 'OTC',
    },
    {
      id: 'dehy_zincovit',
      name: { en: 'Multivitamin + Zinc (Zincovit)', hi: 'मल्टीविटामिन + जिंक (जिंकोविट)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After lunch', hi: 'दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '15 days', hi: '15 दिन' },
      purpose: { en: 'Restores minerals and speeds recovery from weakness', hi: 'खनिजों की भरपाई कर कमज़ोरी जल्दी दूर करता है' },
      instructions: { en: 'Take after lunch with water.', hi: 'दोपहर के खाने के बाद पानी से लें।' },
      precautions: { en: 'Avoid very salty preserved foods during recovery.', hi: 'सुधार के दौरान बहुत नमकीन पैकेटबंद खाना न खाएं।' },
      rxType: 'OTC',
    },
  ],

  diarrhea: [
    {
      id: 'dia_o2',
      name: { en: 'Ofloxacin + Ornidazole (O2 Tablet)', hi: 'ओ2 गोली (ओफ्लॉक्सासिन + ऑर्निडाज़ोल)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '3 days', hi: '3 दिन' },
      purpose: { en: 'Kills infection-causing germs in loose motions', hi: 'दस्त पैदा करने वाले कीटाणुओं को मारता है' },
      instructions: { en: 'Take after food with water. Eat khichdi, curd and banana.', hi: 'खाने के बाद पानी से लें। खिचड़ी, दही और केला खाएं।' },
      precautions: { en: 'If blood in stool or no improvement in 2 days, see a doctor.', hi: 'शौच में खून आए या 2 दिन में आराम न मिले तो डॉक्टर से मिलें।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'dia_ors',
      name: { en: 'ORS + Zinc 20mg', hi: 'ओआरएस + जिंक 20mg' },
      form: { en: 'Sachet + Tablet', hi: 'सैशे + गोली' },
      timing: { en: 'After every loose stool', hi: 'हर दस्त के बाद' },
      timingType: 'throughout_day',
      schedule: { en: 'ORS solution after each motion; Zinc once daily', hi: 'हर दस्त के बाद ORS; जिंक रोज़ 1 बार' },
      duration: { en: 'Until recovery + Zinc 14 days', hi: 'ठीक होने तक + जिंक 14 दिन' },
      purpose: { en: 'Prevents dangerous dehydration and shortens diarrhea duration', hi: 'खतरनाक पानी की कमी रोकता है और दस्त जल्दी ठीक करता है' },
      instructions: { en: 'Mix ORS in 1 litre clean water. Continue normal feeding.', hi: '1 लीटर साफ पानी में ORS घोलें। सामान्य खाना जारी रखें।' },
      precautions: { en: 'Never stop fluids. Children and elderly need extra care.', hi: 'तरल पदार्थ बंद न करें। बच्चों व बुजुर्गों का विशेष ध्यान रखें।' },
      rxType: 'OTC',
    },
  ],

  constipation: [
    {
      id: 'const_looz',
      name: { en: 'Lactulose Syrup (Looz 10g/15ml)', hi: 'लैक्टुलोज सिरप (लूज़)' },
      form: { en: 'Syrup', hi: 'सिरप' },
      timing: { en: 'At bedtime', hi: 'सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '15ml once daily at night', hi: 'रोज़ रात में 15 मिली' },
      duration: { en: '7 days', hi: '7 दिन' },
      purpose: { en: 'Softens hard stool for easy morning motion', hi: 'कड़ा मल नरम कर सुबह शौच आसान बनाता है' },
      instructions: { en: 'Take at night. Drink 3 litres of water daily.', hi: 'रात को लें। रोज़ 3 लीटर पानी पिएं।' },
      precautions: { en: 'If severe stomach pain or vomiting with constipation, do not take — see doctor.', hi: 'कब्ज के साथ तेज़ पेट दर्द या उल्टी हो तो न लें — डॉक्टर से मिलें।' },
      rxType: 'OTC',
    },
    {
      id: 'const_softovac',
      name: { en: 'Isabgol Husk (Softovac Powder)', hi: 'इसबगोल भूसी (सॉफ्टोवैक)' },
      form: { en: 'Powder', hi: 'चूर्ण' },
      timing: { en: 'At bedtime in warm water', hi: 'रात को गुनगुने पानी में' },
      timingType: 'bedtime',
      schedule: { en: '2 teaspoons in a glass of warm water', hi: '1 गिलास गुनगुने पानी में 2 चम्मच' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Natural fibre that regulates daily bowel movement', hi: 'प्राकृतिक फाइबर जो रोज़ शौच नियमित करता है' },
      instructions: { en: 'Drink immediately after mixing. Eat papaya and leafy vegetables.', hi: 'घोलते ही पिएं। पपीता और हरी सब्जियां खाएं।' },
      precautions: { en: 'Drink a full glass of water with it, else it may worsen blockage.', hi: 'पूरा गिलास पानी साथ पिएं, वरना कब्ज बढ़ सकती है।' },
      rxType: 'OTC',
    },
  ],

  vomiting: [
    {
      id: 'vom_emeset',
      name: { en: 'Ondansetron 4mg (Emeset)', hi: 'ओन्डान्सेट्रॉन 4mg (एमिसेट)' },
      form: { en: 'Mouth-dissolving Tablet', hi: 'मुंह में घुलने वाली गोली' },
      timing: { en: 'SOS 30 min before meals', hi: 'खाने से 30 मिनट पहले (ज़रूरत पर)' },
      timingType: 'sos',
      schedule: { en: '1 tablet up to 3 times daily as needed', hi: 'ज़रूरत पर दिन में अधिकतम 3 बार' },
      duration: { en: 'As needed', hi: 'ज़रूरत पड़ने पर' },
      purpose: { en: 'Stops nausea and vomiting quickly', hi: 'मतली और उल्टी तुरंत रोकता है' },
      instructions: { en: 'Let it dissolve on the tongue. Sip ORS in small amounts after 30 minutes.', hi: 'जीभ पर घुलने दें। 30 मिनट बाद थोड़ा-थोड़ा ORS पिएं।' },
      precautions: { en: 'If vomiting blood or severe headache with vomiting, go to emergency.', hi: 'खून की उल्टी या तेज़ सिरदर्द के साथ उल्टी हो तो आपातकाल जाएं।' },
      rxType: 'OTC / Prescribed',
    },
    {
      id: 'vom_pan',
      name: { en: 'Pantoprazole 40mg (Pan 40)', hi: 'पैंटोप्राजोल 40mg (पैन 40)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Before breakfast (empty stomach)', hi: 'नाश्ते से पहले (खाली पेट)' },
      timingType: 'before_food',
      schedule: { en: '1 tablet once daily in the morning', hi: 'रोज़ाना सुबह 1 गोली' },
      duration: { en: '7 days', hi: '7 दिन' },
      purpose: { en: 'Calms stomach acid that triggers vomiting', hi: 'उल्टी बढ़ाने वाले पेट के एसिड को शांत करता है' },
      instructions: { en: 'Swallow whole 30 minutes before breakfast.', hi: 'नाश्ते से आधा घंटा पहले साबुत निगलें।' },
      precautions: { en: 'Avoid oily, spicy food till vomiting fully stops.', hi: 'उल्टी पूरी तरह बंद होने तक तला-भुना व मसालेदार न खाएं।' },
      rxType: 'OTC / Prescribed',
    },
  ],

  acne: [
    {
      id: 'acne_deriva',
      name: { en: 'Adapalene + Clindamycin Gel (Deriva-CMS)', hi: 'डेरिवा-CMS जेल' },
      form: { en: 'Topical Gel', hi: 'लगाने वाली जेल' },
      timing: { en: 'At bedtime (pea-sized)', hi: 'सोते समय (मटर के दाने जितना)' },
      timingType: 'bedtime',
      schedule: { en: 'Thin film on pimples once nightly', hi: 'रोज़ रात में मुंहासों पर पतली परत' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Unclogs pores, kills acne bacteria and fades marks', hi: 'रोमछिद्र खोलता है, मुंहासों के कीटाणु मारता है और दाग हल्के करता है' },
      instructions: { en: 'Wash face, pat dry, apply a thin layer. Use sunscreen in daytime.', hi: 'मुंह धोकर सुखाएं, पतली परत लगाएं। दिन में सनस्क्रीन लगाएं।' },
      precautions: { en: 'Do not squeeze pimples. Mild redness in first week is normal.', hi: 'मुंहासे न फोड़ें। पहले हफ्ते हल्की लाली सामान्य है।' },
      rxType: 'Prescription Guidance',
    },
    {
      id: 'acne_doxy',
      name: { en: 'Doxycycline 100mg', hi: 'डॉक्सीसाइक्लिन 100mg' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'After lunch', hi: 'दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 capsule once daily', hi: 'रोज़ाना 1 कैप्सूल' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Fights deep acne infection from inside', hi: 'अंदर से गहरे मुंहासों के संक्रमण को खत्म करता है' },
      instructions: { en: 'Take with a full glass of water. Do not lie down for 30 minutes after.', hi: 'पूरे गिलास पानी से लें। लेने के 30 मिनट तक न लेटें।' },
      precautions: { en: 'Avoid sun exposure. Not for pregnant women.', hi: 'धूप से बचें। गर्भवती महिलाओं के लिए नहीं।' },
      rxType: 'Prescription Only',
    },
  ],

  fungal_infection: [
    {
      id: 'fungal_itra',
      name: { en: 'Itraconazole 100mg (Itaspore)', hi: 'इट्राकोनाज़ोल 100mg' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 capsule twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Kills ringworm fungus from inside the body', hi: 'शरीर के अंदर से दाद-खाज के फंगस को मारता है' },
      instructions: { en: 'Take after meals. Complete the full course even if itching stops.', hi: 'खाने के बाद लें। खुजली बंद होने पर भी पूरा कोर्स करें।' },
      precautions: { en: 'Keep the area dry. Use a separate towel and change clothes daily.', hi: 'जगह सूखी रखें। अलग तौलिया इस्तेमाल करें, रोज़ कपड़े बदलें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'fungal_luli',
      name: { en: 'Luliconazole Cream 1% (Lulifin)', hi: 'लुलिकोनाज़ोल क्रीम' },
      form: { en: 'Topical Cream', hi: 'लगाने वाली क्रीम' },
      timing: { en: 'Morning & night', hi: 'सुबह और रात' },
      timingType: 'throughout_day',
      schedule: { en: 'Thin layer twice daily, 2cm beyond the patch edge', hi: 'दिन में 2 बार दाने से 2 सेमी बाहर तक' },
      duration: { en: '21 days', hi: '21 दिन' },
      purpose: { en: 'Destroys fungus on the skin surface and stops spread', hi: 'त्वचा पर फंगस खत्म करती है और फैलने से रोकती है' },
      instructions: { en: 'Wash and dry the area before applying.', hi: 'लगाने से पहले जगह धोकर सुखाएं।' },
      precautions: { en: 'Do not use steroid creams (like Betnovate) on fungal patches.', hi: 'फंगल दानों पर स्टेरॉयड क्रीम (जैसे बेटनोवेट) न लगाएं।' },
      rxType: 'Prescription Guidance',
    },
  ],

  red_eye: [
    {
      id: 'redeye_moxi',
      name: { en: 'Moxifloxacin Eye Drops 0.5% (Moxicip)', hi: 'मोक्सिसिप आई ड्रॉप्स' },
      form: { en: 'Sterile Eye Drops', hi: 'आई ड्रॉप्स' },
      timing: { en: '4 times daily', hi: 'दिन में 4 बार' },
      timingType: 'throughout_day',
      schedule: { en: '1 drop in the affected eye', hi: 'प्रभावित आंख में 1 बूंद' },
      duration: { en: '7 days', hi: '7 दिन' },
      purpose: { en: 'Kills eye infection germs causing redness and discharge', hi: 'लाली और कीचड़ पैदा करने वाले आंख के कीटाणु मारता है' },
      instructions: { en: 'Wash hands before use. Do not touch dropper to eye.', hi: 'इस्तेमाल से पहले हाथ धोएं। ड्रॉपर आंख से न छुएं।' },
      precautions: { en: 'Do not share towels or kajal. If vision blurs severely, see an eye doctor.', hi: 'तौलिया या काजल साझा न करें। दिखना बहुत धुंधला हो तो नेत्र विशेषज्ञ से मिलें।' },
      rxType: 'Prescription Guidance',
    },
    {
      id: 'redeye_tears',
      name: { en: 'Lubricant Drops (Refresh Tears)', hi: 'रिफ्रेश टियर्स ड्रॉप्स' },
      form: { en: 'Sterile Eye Drops', hi: 'आई ड्रॉप्स' },
      timing: { en: '4 times daily', hi: 'दिन में 4 बार' },
      timingType: 'throughout_day',
      schedule: { en: '1 drop in each eye', hi: 'दोनों आंखों में 1-1 बूंद' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Soothes burning, itching and dryness of red eyes', hi: 'लाल आंखों की जलन, खुजली और सूखापन शांत करता है' },
      instructions: { en: 'Wait 10 minutes between two different eye drops.', hi: 'दो अलग ड्रॉप्स के बीच 10 मिनट का अंतर रखें।' },
      precautions: { en: 'Avoid rubbing eyes and using contact lenses till recovery.', hi: 'ठीक होने तक आंखें न मलें और लेंस न पहनें।' },
      rxType: 'OTC',
    },
  ],

  vision_problems: [
    {
      id: 'vision_lutein',
      name: { en: 'Lutein + Zeaxanthin + Vitamin A (I-Site)', hi: 'आई-साइट कैप्सूल (ल्यूटिन + विटामिन A)' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'After breakfast', hi: 'नाश्ते के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 capsule once daily', hi: 'रोज़ाना 1 कैप्सूल' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Nourishes retina and slows vision deterioration', hi: 'आंख के पर्दे को पोषण देता है और नज़र कमज़ोर होने से रोकता है' },
      instructions: { en: 'Take after breakfast. Follow the 20-20-20 screen rule.', hi: 'नाश्ते के बाद लें। 20-20-20 स्क्रीन नियम अपनाएं।' },
      precautions: { en: 'A refraction (number) test and retina checkup are still needed.', hi: 'नंबर की जांच और पर्दे की जांच फिर भी ज़रूरी है।' },
      rxType: 'OTC',
    },
    {
      id: 'vision_tears',
      name: { en: 'Lubricant Eye Drops (Refresh Tears)', hi: 'रिफ्रेश टियर्स ड्रॉप्स' },
      form: { en: 'Sterile Eye Drops', hi: 'आई ड्रॉप्स' },
      timing: { en: '3 times daily', hi: 'दिन में 3 बार' },
      timingType: 'throughout_day',
      schedule: { en: '1–2 drops in both eyes', hi: 'दोनों आंखों में 1-2 बूंद' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Relieves strain, dryness and heaviness from screen use', hi: 'स्क्रीन से होने वाली थकान, सूखापन और भारीपन दूर करता है' },
      instructions: { en: 'Blink often while using mobile. Keep screen brightness low.', hi: 'मोबाइल चलाते समय बार-बार पलकें झपकाएं। ब्राइटनेस कम रखें।' },
      precautions: { en: 'If sudden vision loss or flashes of light occur, rush to eye emergency.', hi: 'अचानक दिखना बंद हो या चमक दिखे तो तुरंत आंख आपातकाल जाएं।' },
      rxType: 'OTC',
    },
  ],

  ear_pain: [
    {
      id: 'ear_antibiotic',
      name: { en: 'Amoxicillin + Clavulanate 625mg (Moxikind-CV)', hi: 'मोक्सीकाइंड-CV 625mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Clears middle-ear bacterial infection causing pain and fever', hi: 'कान के अंदर दर्द व बुखार पैदा करने वाले संक्रमण को खत्म करता है' },
      instructions: { en: 'Take after food. Complete the full 5-day course.', hi: 'खाने के बाद लें। पूरा 5 दिन का कोर्स करें।' },
      precautions: { en: 'If ear discharge with blood or hearing loss occurs, see ENT urgently.', hi: 'खून वाला मवाद या सुनना कम हो तो तुरंत ENT से मिलें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'ear_drops',
      name: { en: 'Antibiotic Ear Drops (Otek-AC)', hi: 'कान की ड्रॉप्स (ओटेक-AC)' },
      form: { en: 'Otic Drops', hi: 'कान की बूंदें' },
      timing: { en: '3 times daily', hi: 'दिन में 3 बार' },
      timingType: 'throughout_day',
      schedule: { en: '4 drops in the affected ear', hi: 'दर्द वाले कान में 4 बूंद' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Numbs ear pain locally and fights surface infection', hi: 'कान का दर्द स्थानीय रूप से सुन्न करती है और संक्रमण मारती है' },
      instructions: { en: 'Warm the bottle in palms first. Lie sideways for 5 minutes after drops.', hi: 'पहले शीशी हथेलियों में गर्म करें। बूंद डालकर 5 मिनट करवट लेटें।' },
      precautions: { en: 'Keep ear dry — no swimming or earbuds. Do not insert sticks or pins.', hi: 'कान सूखा रखें — तैराकी या ईयरबड न डालें। तीली या पिन न डालें।' },
      rxType: 'Prescription Guidance',
    },
  ],

  sore_throat: [
    {
      id: 'throat_azithral',
      name: { en: 'Azithromycin 500mg (Azithral)', hi: 'एज़िथ्रोमाइसिन 500mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food (once daily)', hi: 'भोजन के बाद (दिन में 1 बार)' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '3 days', hi: '3 दिन' },
      purpose: { en: 'Kills throat bacterial infection causing pain and swelling', hi: 'गले के दर्द व सूजन वाले जीवाणु संक्रमण को मारता है' },
      instructions: { en: 'Take after food at the same time daily.', hi: 'रोज़ एक ही समय खाने के बाद लें।' },
      precautions: { en: 'If unable to swallow even water or breathing is noisy, go to emergency.', hi: 'पानी भी न निगल पाए या सांस में आवाज़ हो तो आपातकाल जाएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'throat_gargle',
      name: { en: 'Betadine Gargle 2% + Strepsils Lozenges', hi: 'बेटाडीन गरारे + स्ट्रेप्सिल्स' },
      form: { en: 'Gargle + Lozenge', hi: 'गरारे + चूसने वाली गोली' },
      timing: { en: 'Twice daily + lozenge every 4 hours', hi: 'दिन में 2 बार गरारे + हर 4 घंटे में 1 गोली' },
      timingType: 'throughout_day',
      schedule: { en: '10ml gargle twice daily; lozenge as needed', hi: '10 मिली गरारे दिन में 2 बार; गोली ज़रूरत पर' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Disinfects throat lining and soothes pain while swallowing', hi: 'गले की अंदरूनी परत साफ करता है और निगलने का दर्द कम करता है' },
      instructions: { en: 'Gargle for 30 seconds and spit — do not swallow. Drink warm water.', hi: '30 सेकंड गरारे कर थूक दें — निगलें नहीं। गुनगुना पानी पिएं।' },
      precautions: { en: 'Avoid cold drinks, ice cream and fried food till healed.', hi: 'ठीक होने तक ठंडे पेय, आइसक्रीम और तला-भुना न खाएं।' },
      rxType: 'OTC',
    },
  ],

  thyroid: [
    {
      id: 'thyroid_thyronorm',
      name: { en: 'Levothyroxine 75mcg (Thyronorm)', hi: 'थायरॉनॉर्म 75mcg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Empty stomach (30 min before food)', hi: 'खाली पेट (खाने से 30 मिनट पहले)' },
      timingType: 'before_food',
      schedule: { en: '1 tablet every morning on empty stomach', hi: 'रोज़ सुबह खाली पेट 1 गोली' },
      duration: { en: '30 days (lifelong therapy)', hi: '30 दिन (लंबे समय तक)' },
      purpose: { en: 'Replaces missing thyroid hormone to control weight, fatigue and swelling', hi: 'कम थायरॉइड हार्मोन की भरपाई कर वज़न, थकान व सूजन नियंत्रित करता है' },
      instructions: { en: 'Take with plain water only. Do not take calcium/iron within 4 hours of it.', hi: 'सिर्फ सादे पानी से लें। इसके 4 घंटे के अंदर कैल्शियम/आयरन न लें।' },
      precautions: { en: 'Repeat TFT blood test after 6 weeks. Never stop on your own.', hi: '6 हफ्ते बाद TFT खून जांच दोहराएं। खुद से बंद न करें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'thyroid_shelcal',
      name: { en: 'Calcium + Vitamin D3 (Shelcal 500)', hi: 'शेल्काल (कैल्शियम + D3)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After lunch', hi: 'दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Protects bones weakened by thyroid imbalance', hi: 'थायरॉइड असंतुलन से कमज़ोर हड्डियों की रक्षा करता है' },
      instructions: { en: 'Take after lunch, at least 4 hours after Thyronorm.', hi: 'दोपहर के खाने के बाद लें — थायरॉनॉर्म के 4 घंटे बाद।' },
      precautions: { en: 'Morning sunlight for 15 minutes daily helps vitamin D.', hi: 'रोज़ सुबह 15 मिनट धूप विटामिन D के लिए ज़रूरी है।' },
      rxType: 'OTC',
    },
  ],

  obesity: [
    {
      id: 'ob_orlistat',
      name: { en: 'Orlistat 120mg (Orlica)', hi: 'ऑर्लिस्टैट 120mg (ऑर्लिका)' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'With fat-containing meals', hi: 'चिकनाई वाले भोजन के साथ' },
      timingType: 'after_food',
      schedule: { en: '1 capsule thrice daily with meals', hi: 'भोजन के साथ दिन में 3 बार' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Blocks fat absorption from food to support weight loss', hi: 'भोजन से वसा का अवशोषण रोककर वज़न घटाने में मदद करता है' },
      instructions: { en: 'Skip the dose if you skip a meal or eat fat-free food. Walk 45 minutes daily.', hi: 'खाना छोड़ें तो खुराक भी छोड़ें। रोज़ 45 मिनट टहलें।' },
      precautions: { en: 'Oily stools are expected. Take a multivitamin at bedtime.', hi: 'तैलीय शौच सामान्य है। रात को मल्टीविटामिन लें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'ob_zincovit',
      name: { en: 'Multivitamin + Minerals (Zincovit)', hi: 'मल्टीविटामिन (जिंकोविट)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After breakfast', hi: 'नाश्ते के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Prevents vitamin deficiency during dieting and boosts metabolism', hi: 'डाइटिंग में विटामिन कमी रोकता है और चयापचय बढ़ाता है' },
      instructions: { en: 'Eat high-protein low-oil food: dal, paneer, eggs, sprouts.', hi: 'अधिक प्रोटीन कम तेल वाला खाना खाएं: दाल, पनीर, अंडे, अंकुरित।' },
      precautions: { en: 'Avoid crash diets and weight-loss powders without doctor advice.', hi: 'बिना सलाह क्रैश डाइट या वज़न घटाने वाले पाउडर न लें।' },
      rxType: 'OTC',
    },
  ],

  kidney_stone: [
    {
      id: 'stone_tamsulosin',
      name: { en: 'Tamsulosin 0.4mg (Urimax)', hi: 'टैम्सुलोसिन 0.4mg (यूरिमैक्स)' },
      form: { en: 'Capsule', hi: 'कैप्सूल' },
      timing: { en: 'At bedtime after food', hi: 'रात को खाने के बाद सोते समय' },
      timingType: 'bedtime',
      schedule: { en: '1 capsule once daily at night', hi: 'रोज़ाना रात में 1 कैप्सूल' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Relaxes urinary passage so small stones pass out easily', hi: 'पेशाब की नली ढीली कर छोटी पथरी आसानी से निकालता है' },
      instructions: { en: 'Take after dinner. Drink 4 litres of water daily.', hi: 'रात के खाने के बाद लें। रोज़ 4 लीटर पानी पिएं।' },
      precautions: { en: 'If severe pain with vomiting or fever occurs, go to emergency — stone may be blocked.', hi: 'उल्टी या बुखार के साथ तेज़ दर्द हो तो आपातकाल जाएं — पथरी अटक सकती है।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'stone_cystone',
      name: { en: 'Cystone Forte + Ston-1 Syrup', hi: 'सिस्टोन फोर्ट + स्टोन-1 सिरप' },
      form: { en: 'Tablet + Syrup', hi: 'गोली + सिरप' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '2 tablets twice daily + 2 tsp syrup thrice daily in water', hi: '2 गोली दिन में 2 बार + 2 चम्मच सिरप दिन में 3 बार पानी में' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Dissolves small stones and prevents new stone formation', hi: 'छोटी पथरी घोलता है और नई पथरी बनने से रोकता है' },
      instructions: { en: 'Reduce spinach, tomato seeds and excess salt. Do not hold urine.', hi: 'पालक, टमाटर के बीज और ज़्यादा नमक कम करें। पेशाब न रोकें।' },
      precautions: { en: 'Stones above 8mm usually need surgery — get a USG KUB done.', hi: '8mm से बड़ी पथरी में अक्सर ऑपरेशन लगता है — USG KUB करवाएं।' },
      rxType: 'OTC / Prescribed',
    },
  ],

  menstrual_pain: [
    {
      id: 'mens_meftal',
      name: { en: 'Mefenamic Acid + Dicyclomine (Meftal-Spas)', hi: 'मेफ्टाल-स्पास गोली' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food (first 3 days)', hi: 'भोजन के बाद (पहले 3 दिन)' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily during periods', hi: 'मासिक के दौरान दिन में 2 बार' },
      duration: { en: '3 days per cycle', hi: 'हर चक्र में 3 दिन' },
      purpose: { en: 'Relieves period cramps and lower-abdomen pain', hi: 'मासिक के मरोड़ व पेट के निचले दर्द में राहत देता है' },
      instructions: { en: 'Take after food. Apply a hot water bag on the lower abdomen.', hi: 'खाने के बाद लें। पेट के निचले हिस्से पर गर्म थैली रखें।' },
      precautions: { en: 'If pain is unbearable every month or bleeding is very heavy, get a USG pelvis done.', hi: 'हर महीने असहनीय दर्द या बहुत ज़्यादा रक्तस्राव हो तो USG पेल्विस करवाएं।' },
      rxType: 'Prescription / Pharmacist',
    },
    {
      id: 'mens_iron',
      name: { en: 'Iron + Folic Acid (Orofer-XT)', hi: 'आयरन + फोलिक एसिड (ओरोफर-XT)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After lunch', hi: 'दोपहर के खाने के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '30 days', hi: '30 दिन' },
      purpose: { en: 'Replaces blood loss and prevents anemia from periods', hi: 'मासिक में हुए खून की भरपाई कर खून की कमी रोकता है' },
      instructions: { en: 'Take after lunch. Eat dates, jaggery and green vegetables.', hi: 'दोपहर के खाने के बाद लें। खजूर, गुड़ और हरी सब्जियां खाएं।' },
      precautions: { en: 'Black stools are normal with iron tablets.', hi: 'आयरन की गोली से काला शौच सामान्य है।' },
      rxType: 'OTC',
    },
  ],

  pregnancy_care: [
    {
      id: 'preg_folic',
      name: { en: 'Folic Acid 5mg (Folvite)', hi: 'फोलिक एसिड 5mg (फोल्वाइट)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'Morning', hi: 'सुबह' },
      timingType: 'after_food',
      schedule: { en: '1 tablet once daily', hi: 'रोज़ाना 1 गोली' },
      duration: { en: '90 days', hi: '90 दिन' },
      purpose: { en: 'Essential for healthy brain and spine development of the baby', hi: 'शिशु के मस्तिष्क व रीढ़ के स्वस्थ विकास के लिए ज़रूरी' },
      instructions: { en: 'Take every morning. Attend monthly antenatal check-ups.', hi: 'रोज़ सुबह लें। हर महीने गर्भावस्था जांच के लिए जाएं।' },
      precautions: { en: 'Do NOT take any other medicine without asking your gynecologist.', hi: 'स्त्री रोग विशेषज्ञ से पूछे बिना कोई अन्य दवा न लें।' },
      rxType: 'Prescription (ANC)',
    },
    {
      id: 'preg_iron_calcium',
      name: { en: 'Iron (Orofer-XT) + Calcium (Shelcal 500)', hi: 'आयरन + कैल्शियम (गर्भावस्था)' },
      form: { en: 'Tablets', hi: 'गोलियां' },
      timing: { en: 'Iron after lunch, Calcium morning & night', hi: 'आयरन दोपहर बाद, कैल्शियम सुबह-रात' },
      timingType: 'after_food',
      schedule: { en: 'Iron 1/day + Calcium 2/day', hi: 'आयरन रोज़ 1 + कैल्शियम रोज़ 2' },
      duration: { en: '90 days', hi: '90 दिन' },
      purpose: { en: 'Builds baby bones and keeps mother free from anemia', hi: 'शिशु की हड्डियां बनाता है और मां को खून की कमी से बचाता है' },
      instructions: { en: 'Keep a 4-hour gap between iron and calcium tablets.', hi: 'आयरन और कैल्शियम की गोली में 4 घंटे का अंतर रखें।' },
      precautions: { en: 'If bleeding, severe headache or reduced baby movement occurs, rush to hospital.', hi: 'रक्तस्राव, तेज़ सिरदर्द या शिशु की हलचल कम हो तो तुरंत अस्पताल जाएं।' },
      rxType: 'Prescription (ANC)',
    },
  ],

  toothache: [
    {
      id: 'tooth_antibiotic',
      name: { en: 'Amoxicillin + Clavulanate 625mg (Moxikind-CV)', hi: 'मोक्सीकाइंड-CV 625mg' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Kills dental abscess infection causing throbbing tooth pain', hi: 'धड़कते दांत दर्द वाले मवाद के संक्रमण को मारता है' },
      instructions: { en: 'Take after food. Complete the full course. Brush twice daily with soft brush.', hi: 'खाने के बाद लें। पूरा कोर्स करें। नरम ब्रश से दिन में 2 बार ब्रश करें।' },
      precautions: { en: 'If cheek swells shut or fever rises, see a dentist within 24 hours.', hi: 'गाल सूजकर बंद हो या बुखार बढ़े तो 24 घंटे में दंत चिकित्सक से मिलें।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'tooth_painkiller',
      name: { en: 'Ketorolac 10mg (Ketorol-DT) + Rexidine Mouthwash', hi: 'कीटोरोल-DT + रेक्सिडीन कुल्ला' },
      form: { en: 'Dispersible Tablet + Mouthwash', hi: 'घुलने वाली गोली + कुल्ला' },
      timing: { en: 'SOS for pain + rinse twice daily', hi: 'दर्द पर + दिन में 2 बार कुल्ला' },
      timingType: 'sos',
      schedule: { en: 'Dissolve 1 tablet in water when pain is severe; 15ml rinse twice daily', hi: 'तेज़ दर्द पर 1 गोली पानी में घोलकर; 15 मिली कुल्ला दिन में 2 बार' },
      duration: { en: 'As needed + rinse 7 days', hi: 'ज़रूरत पर + कुल्ला 7 दिन' },
      purpose: { en: 'Instant strong tooth-pain relief and germ-free mouth', hi: 'तुरंत तेज़ दांत दर्द में राहत और कीटाणु-मुक्त मुंह' },
      instructions: { en: 'Do not swallow the mouthwash. Avoid very hot or cold food.', hi: 'कुल्ला निगलें नहीं। बहुत गर्म या ठंडा खाना न खाएं।' },
      precautions: { en: 'Painkillers only mask pain — a dentist visit for RCT/extraction is still needed.', hi: 'दर्द निवारक सिर्फ दर्द दबाते हैं — RCT/निकासी के लिए दंत चिकित्सक से मिलना ज़रूरी है।' },
      rxType: 'Prescription / Pharmacist',
    },
  ],

  gum_problems: [
    {
      id: 'gum_flagyl',
      name: { en: 'Metronidazole 400mg (Flagyl)', hi: 'मेट्रोनिडाज़ोल 400mg (फ्लैजिल)' },
      form: { en: 'Tablet', hi: 'गोली (टैबलेट)' },
      timing: { en: 'After food', hi: 'भोजन के बाद' },
      timingType: 'after_food',
      schedule: { en: '1 tablet twice daily', hi: 'दिन में 2 बार' },
      duration: { en: '5 days', hi: '5 दिन' },
      purpose: { en: 'Clears gum infection causing swelling and bleeding', hi: 'मसूड़ों की सूजन व खून वाले संक्रमण को खत्म करता है' },
      instructions: { en: 'Take after food. Brush gently with a soft brush twice daily.', hi: 'खाने के बाद लें। नरम ब्रश से दिन में 2 बार हल्के से ब्रश करें।' },
      precautions: { en: 'Strictly no alcohol during and 48 hours after this medicine.', hi: 'इस दवा के दौरान और 48 घंटे बाद तक बिल्कुल शराब न पिएं।' },
      rxType: 'Prescription Only',
    },
    {
      id: 'gum_gel',
      name: { en: 'Chlorhexidine + Metronidazole Gum Gel (Rexidine-M)', hi: 'रेक्सिडीन-M मसूड़ा जेल' },
      form: { en: 'Topical Oral Gel', hi: 'मसूड़ों पर लगाने वाली जेल' },
      timing: { en: 'Morning & night after brushing', hi: 'सुबह-रात ब्रश के बाद' },
      timingType: 'throughout_day',
      schedule: { en: 'Massage over gums twice daily', hi: 'दिन में 2 बार मसूड़ों पर मलें' },
      duration: { en: '14 days', hi: '14 दिन' },
      purpose: { en: 'Heals bleeding gums and tightens loose gum tissue', hi: 'खून आते मसूड़ों को ठीक करती है और ढीले मसूड़े कसती है' },
      instructions: { en: 'Do not eat or drink for 30 minutes after applying.', hi: 'लगाने के 30 मिनट तक कुछ न खाएं-पिएं।' },
      precautions: { en: 'If gums bleed daily for 2 weeks, get professional scaling done.', hi: '2 हफ्ते तक रोज़ खून आए तो दंत चिकित्सक से सफाई करवाएं।' },
      rxType: 'OTC',
    },
  ],
}

// ─────────────────────────────────────────────
// Advice per condition
// ─────────────────────────────────────────────

function chestPainAdvice(responses, redFlagCount) {
  const severe = scaleValue(responses, 'severity') >= 7
  const radiation = hasValue(responses, 'site', 'Radiating')
  const crushing = hasValue(responses, 'character', 'Crushing', 'Pressure')
  const associated = hasValue(responses, 'associated', 'Dyspnea', 'Diaphoresis', 'Dizziness/Syncope')
  const prolonged = hasValue(responses, 'timing', 'Prolonged >20min', 'Constant')

  if (redFlagCount >= 2 || (crushing && associated) || (radiation && severe)) {
    return {
      triage: TRIAGE.EMERGENCY,
      immediateActions: {
        en: ['Call 112 / 108 immediately', 'Chew an aspirin 325mg if not allergic', 'Sit or lie in a comfortable position', 'Do NOT drive yourself to hospital'],
        hi: ['तुरंत 112 / 108 पर कॉल करें', 'यदि एलर्जी नहीं है तो एस्पिरिन 325mg चबाएं', 'आराम की स्थिति में बैठें या लेटें', 'खुद ड्राइव करके अस्पताल न जाएं'],
      },
      homeAdvice: { en: [], hi: [] },
      warning: { en: 'This could be a heart attack. Every minute counts.', hi: 'यह हार्ट अटैक हो सकता है। हर मिनट मायने रखता है।' },
      followUp: { en: 'Emergency cardiology evaluation required.', hi: 'आपातकालीन हृदय रोग मूल्यांकन आवश्यक है।' },
    }
  }
  if (redFlagCount === 1 || prolonged || severe) {
    return {
      triage: TRIAGE.URGENT,
      immediateActions: { en: ['Go to a hospital/clinic today', 'Avoid strenuous activity', 'Keep aspirin handy'], hi: ['आज अस्पताल / क्लिनिक जाएं', 'कठिन गतिविधि से बचें', 'एस्पिरिन पास रखें'] },
      homeAdvice: { en: ['Rest completely', 'Monitor symptoms closely'], hi: ['पूरी तरह आराम करें', 'लक्षणों पर नज़र रखें'] },
      warning: { en: 'If pain worsens or spreads to arm/jaw, call 108 immediately.', hi: 'अगर दर्द बढ़े या बांह/जबड़े तक फैले तो तुरंत 108 पर कॉल करें।' },
      followUp: { en: 'ECG and cardiac enzymes needed.', hi: 'ECG और कार्डियक एंज़ाइम जाँच ज़रूरी है।' },
    }
  }
  return {
    triage: TRIAGE.ROUTINE,
    immediateActions: { en: ['Schedule a doctor visit this week', 'Avoid triggers like spicy food, stress'], hi: ['इस हफ्ते डॉक्टर से मिलें', 'मसालेदार खाना और तनाव से बचें'] },
    homeAdvice: { en: ['Try antacids if burning type', 'Rest and monitor symptoms'], hi: ['अगर जलन है तो एंटासिड लें', 'आराम करें और लक्षण देखें'] },
    warning: { en: 'Seek emergency care if pain becomes severe or spreading.', hi: 'अगर दर्द गंभीर हो जाए तो आपातकालीन देखभाल लें।' },
    followUp: { en: 'Consult a physician for further evaluation.', hi: 'आगे की जाँच के लिए चिकित्सक से मिलें।' },
  }
}

function headacheAdvice(responses, redFlagCount) {
  const thunderclap = hasValue(responses, 'onset', 'Thunderclap')
  const stiffNeck = hasValue(responses, 'associated', 'Neck stiffness')
  const feverWithHA = hasValue(responses, 'associated', 'Fever')
  const visionLoss = hasValue(responses, 'associated', 'Vision changes')
  const trauma = hasValue(responses, 'history', 'Head trauma')
  const severity = scaleValue(responses, 'severity')

  if (thunderclap || (stiffNeck && feverWithHA) || visionLoss || trauma) {
    return {
      triage: TRIAGE.EMERGENCY,
      immediateActions: { en: ['Call 108 / go to emergency immediately', 'Do not take painkillers until evaluated', 'Keep the person awake and observe'], hi: ['तुरंत 108 पर कॉल करें / आपातकाल जाएं', 'जाँच से पहले दर्दनाशक न लें', 'व्यक्ति को जागते रखें और देखें'] },
      homeAdvice: { en: [], hi: [] },
      warning: { en: 'Sudden worst-ever headache may indicate a brain bleed. Act immediately.', hi: 'अचानक सबसे तेज़ सिरदर्द मस्तिष्क में खून का रिसाव हो सकता है।' },
      followUp: { en: 'CT scan and neurological evaluation needed.', hi: 'CT स्कैन और न्यूरोलॉजिकल जाँच ज़रूरी है।' },
    }
  }
  if (redFlagCount >= 1 || severity >= 8) {
    return {
      triage: TRIAGE.URGENT,
      immediateActions: { en: ['See a doctor today', 'Rest in a dark quiet room', 'Stay hydrated'], hi: ['आज डॉक्टर से मिलें', 'अंधेरे शांत कमरे में आराम करें', 'पानी पीते रहें'] },
      homeAdvice: { en: ['Take OTC painkiller (paracetamol)', 'Apply cold compress to forehead'], hi: ['पैरासिटामॉल लें', 'माथे पर ठंडी सिकाई करें'] },
      warning: { en: 'If headache worsens rapidly, seek emergency care.', hi: 'अगर सिरदर्द तेज़ी से बढ़े तो आपातकालीन देखभाल लें।' },
      followUp: { en: 'Blood pressure check and GP review recommended.', hi: 'ब्लड प्रेशर जाँच और डॉक्टर से मिलें।' },
    }
  }
  return {
    triage: TRIAGE.SELFCARE,
    immediateActions: { en: ['Rest in a quiet dark room', 'Drink plenty of water', 'Take paracetamol as needed'], hi: ['शांत कमरे में आराम करें', 'पानी पिएं', 'पैरासिटामॉल लें'] },
    homeAdvice: { en: ['Identify triggers (stress, lack of sleep, dehydration)', 'Regular sleep schedule helps'], hi: ['ट्रिगर पहचानें (तनाव, नींद की कमी, पानी कम)', 'नियमित नींद लें'] },
    warning: { en: 'See a doctor if headaches are frequent or worsening.', hi: 'अगर सिरदर्द बार-बार आए या बढ़े तो डॉक्टर से मिलें।' },
    followUp: { en: 'Consider keeping a headache diary.', hi: 'सिरदर्द की डायरी रखने पर विचार करें।' },
  }
}

function feverAdvice(responses, redFlagCount) {
  const highTemp = hasValue(responses, 'temperature', 'High grade')
  const confusion = hasValue(responses, 'associated', 'Altered consciousness')
  const rash = hasValue(responses, 'associated', 'Rash')
  const longDuration = hasValue(responses, 'duration', '>1 week', '4-7 days')
  const malariaRisk = hasValue(responses, 'travel', 'Malaria risk')
  const overallSeverity = scaleValue(responses, 'severity')

  if (confusion || (rash && highTemp) || overallSeverity >= 9) {
    return {
      triage: TRIAGE.EMERGENCY,
      immediateActions: { en: ['Go to emergency immediately', 'Do not delay — altered consciousness is serious', 'Keep the person cool with wet cloth'], hi: ['तुरंत आपातकाल जाएं', 'देरी न करें — घबराहट गंभीर है', 'गीले कपड़े से ठंडा रखें'] },
      homeAdvice: { en: [], hi: [] },
      warning: { en: 'Fever with confusion or rash can be life-threatening (meningitis, sepsis).', hi: 'बुखार के साथ घबराहट या दाने जानलेवा हो सकते हैं।' },
      followUp: { en: 'Immediate hospital admission likely needed.', hi: 'अस्पताल में भर्ती ज़रूरी हो सकती है।' },
    }
  }
  if (highTemp || longDuration || malariaRisk || redFlagCount >= 1) {
    return {
      triage: TRIAGE.URGENT,
      immediateActions: { en: ['See a doctor today', 'Get blood tests (malaria, dengue, CBC)', 'Stay hydrated with ORS / fluids'], hi: ['आज डॉक्टर से मिलें', 'खून की जाँच करवाएं (मलेरिया, डेंगू, CBC)', 'ORS / तरल पदार्थ पिएं'] },
      homeAdvice: { en: ['Take paracetamol for fever', 'Rest and monitor temperature every 4 hours'], hi: ['बुखार के लिए पैरासिटामॉल लें', 'आराम करें और हर 4 घंटे में बुखार जाँचें'] },
      warning: { en: 'Seek emergency care if fever exceeds 104°F / 40°C or confusion develops.', hi: 'अगर बुखार 104°F से ज़्यादा हो या घबराहट हो तो आपातकाल जाएं।' },
      followUp: { en: 'Blood report results guide further treatment.', hi: 'खून की रिपोर्ट के अनुसार आगे का इलाज।' },
    }
  }
  return {
    triage: TRIAGE.SELFCARE,
    immediateActions: { en: ['Drink 8-10 glasses of water daily', 'Take paracetamol every 6 hours as needed', 'Rest at home'], hi: ['रोज़ 8-10 गिलास पानी पिएं', 'ज़रूरत पर हर 6 घंटे में पैरासिटामॉल लें', 'घर पर आराम करें'] },
    homeAdvice: { en: ['Light diet — khichdi, dal, rice', 'Sponge with lukewarm water for high fever', 'Avoid cold drinks and heavy food'], hi: ['हल्का खाना — खिचड़ी, दाल, चावल', 'तेज़ बुखार में गुनगुने पानी से पोंछें', 'ठंडे पेय और भारी खाने से बचें'] },
    warning: { en: 'See a doctor if fever doesn\'t improve in 3 days or develops rash/confusion.', hi: '3 दिन में बुखार ठीक न हो या दाने/घबराहट हो तो डॉक्टर से मिलें।' },
    followUp: { en: 'Monitor temperature twice daily.', hi: 'दिन में दो बार बुखार जाँचें।' },
  }
}

function mentalHealthAdvice(responses, redFlagCount) {
  const activeSI = hasValue(responses, 'safety', 'Active SI')
  const passiveSI = hasValue(responses, 'safety', 'Passive SI')
  const severe = hasValue(responses, 'severity', 'Severe')

  if (activeSI) {
    return {
      triage: TRIAGE.EMERGENCY,
      immediateActions: { en: ['Call iCall: 9152987821', 'Go to the nearest emergency department', 'Do not leave the person alone', 'Remove access to any harmful objects'], hi: ['iCall पर कॉल करें: 9152987821', 'नज़दीकी आपातकाल जाएं', 'व्यक्ति को अकेला न छोड़ें', 'हानिकारक वस्तुएं हटा दें'] },
      homeAdvice: { en: [], hi: [] },
      warning: { en: 'This is a mental health emergency. Please seek immediate help.', hi: 'यह मानसिक स्वास्थ्य आपातकाल है। तुरंत मदद लें।' },
      followUp: { en: 'Psychiatric evaluation required urgently.', hi: 'मनोचिकित्सक से तुरंत मिलें।' },
    }
  }
  if (passiveSI || severe) {
    return {
      triage: TRIAGE.URGENT,
      immediateActions: { en: ['Call iCall: 9152987821 (free helpline)', 'See a psychiatrist or counselor today', 'Talk to a trusted family member'], hi: ['iCall: 9152987821 (निःशुल्क हेल्पलाइन) पर कॉल करें', 'आज मनोचिकित्सक या काउंसलर से मिलें', 'किसी विश्वसनीय परिवार के सदस्य से बात करें'] },
      homeAdvice: { en: ['Limit alcohol and avoid isolation', 'Regular exercise and sunlight help mood'], hi: ['शराब सीमित करें और एकांत से बचें', 'नियमित व्यायाम और धूप मूड में मदद करती है'] },
      warning: { en: 'If thoughts of self-harm become stronger, call 108 immediately.', hi: 'खुद को नुकसान के विचार बढ़ें तो तुरंत 108 पर कॉल करें।' },
      followUp: { en: 'Regular mental health support is recommended.', hi: 'नियमित मानसिक स्वास्थ्य सहायता की सिफारिश की जाती है।' },
    }
  }
  return {
    triage: TRIAGE.ROUTINE,
    immediateActions: { en: ['Talk to a counselor or GP about your feelings', 'Try mindfulness or breathing exercises daily'], hi: ['अपनी भावनाओं के बारे में काउंसलर या डॉक्टर से बात करें', 'रोज़ माइंडफुलनेस या सांस के व्यायाम करें'] },
    homeAdvice: { en: ['Maintain a regular sleep schedule', 'Physical activity 30 min/day', 'Limit social media and news'], hi: ['नियमित नींद का समय बनाए रखें', 'रोज़ 30 मिनट व्यायाम करें', 'सोशल मीडिया और खबरें सीमित करें'] },
    warning: { en: 'Seek help immediately if thoughts of self-harm develop.', hi: 'खुद को नुकसान के विचार आएं तो तुरंत मदद लें।' },
    followUp: { en: 'Consider scheduling regular sessions with a counselor.', hi: 'काउंसलर के साथ नियमित सत्र पर विचार करें।' },
  }
}

function genericAdvice(conditionName, responses, redFlagCount) {
  if (redFlagCount >= 3) {
    return {
      triage: TRIAGE.EMERGENCY,
      immediateActions: { en: ['Go to the nearest emergency department immediately', 'Call 108 if unable to travel'], hi: ['तुरंत नज़दीकी आपातकाल जाएं', 'जाने में असमर्थ हों तो 108 पर कॉल करें'] },
      homeAdvice: { en: [], hi: [] },
      warning: { en: `Multiple serious warning signs detected for ${conditionName}. Do not delay care.`, hi: `${conditionName} के लिए कई गंभीर चेतावनी संकेत मिले। देखभाल में देरी न करें।` },
      followUp: { en: 'Immediate professional medical evaluation required.', hi: 'तुरंत चिकित्सा मूल्यांकन ज़रूरी है।' },
    }
  }
  if (redFlagCount >= 1) {
    return {
      triage: TRIAGE.URGENT,
      immediateActions: { en: ['See a doctor today', 'Do not ignore these warning signs'], hi: ['आज डॉक्टर से मिलें', 'इन चेतावनी संकेतों को नज़रअंदाज़ न करें'] },
      homeAdvice: { en: ['Rest and monitor your symptoms', 'Stay hydrated'], hi: ['आराम करें और लक्षण देखें', 'पानी पीते रहें'] },
      warning: { en: 'Seek emergency care if symptoms worsen rapidly.', hi: 'अगर लक्षण तेज़ी से बढ़ें तो आपातकालीन देखभाल लें।' },
      followUp: { en: 'Consult a physician for further evaluation and tests.', hi: 'आगे की जाँच के लिए चिकित्सक से मिलें।' },
    }
  }
  return {
    triage: TRIAGE.SELFCARE,
    immediateActions: { en: ['Rest and monitor your symptoms at home', 'Stay hydrated', 'Take OTC medication as appropriate'], hi: ['घर पर आराम करें और लक्षण देखें', 'पानी पीते रहें', 'उचित ओटीसी दवा लें'] },
    homeAdvice: { en: ['Maintain regular sleep and diet', 'Avoid stress and overexertion'], hi: ['नियमित नींद और आहार लें', 'तनाव और अत्यधिक परिश्रम से बचें'] },
    warning: { en: 'See a doctor if symptoms persist more than 5 days or worsen.', hi: '5 दिन से ज़्यादा लक्षण रहें या बढ़ें तो डॉक्टर से मिलें।' },
    followUp: { en: 'Schedule a routine check-up if symptoms recur.', hi: 'लक्षण दोबारा आएं तो नियमित जाँच करवाएं।' },
  }
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
export function getAdvice(conditionId, responses, redFlagCount) {
  let advice
  switch (conditionId) {
    case 'chest_pain':     advice = chestPainAdvice(responses, redFlagCount);     break
    case 'headache':       advice = headacheAdvice(responses, redFlagCount);       break
    case 'fever':          advice = feverAdvice(responses, redFlagCount);          break
    case 'mental_health':  advice = mentalHealthAdvice(responses, redFlagCount);   break
    default:               advice = genericAdvice(conditionId, responses, redFlagCount)
  }

  // Get condition-specific suggested medications
  const suggestedMedications = MEDICATIONS_DATABASE[conditionId] || MEDICATIONS_DATABASE.fever

  return {
    triageLevel:          advice.triage.level,
    triageColor:          advice.triage.color,
    triageLabel:          advice.triage.label,
    immediateActions:     advice.immediateActions,
    homeAdvice:           advice.homeAdvice,
    warning:              advice.warning,
    followUp:             advice.followUp,
    suggestedMedications: suggestedMedications,
  }
}
