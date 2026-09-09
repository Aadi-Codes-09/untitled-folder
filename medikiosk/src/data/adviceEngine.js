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
