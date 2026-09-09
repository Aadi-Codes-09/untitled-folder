/**
 * MediKiosk — Disease Interview Flows
 * Each condition has a SOCRATES-style structured interview.
 * question / label fields are { en, hi } objects for bilingual support.
 */

const q = (en, hi) => ({ en, hi })
const l = (id, en, hi, value, isRedFlag = false, exclusive = false) => ({
  id, label: { en, hi }, value, isRedFlag, exclusive
})

// ─────────────────────────────────────────────
// 1. CHEST PAIN
// ─────────────────────────────────────────────
export const chestPainFlow = [
  {
    id: 'cp_q1', key: 'site', type: 'single',
    question: q('Where exactly is the chest pain?', 'सीने में दर्द कहाँ पर है?'),
    options: [
      l('center', 'Center of chest', 'सीने के बीच में', 'Central/Retrosternal'),
      l('left', 'Left side', 'बाईं ओर', 'Left lateral'),
      l('right', 'Right side', 'दाईं ओर', 'Right lateral'),
      l('radiating', 'Spreading to arm/jaw/back', 'बांह, जबड़े या पीठ तक', 'Radiating', true),
    ],
  },
  {
    id: 'cp_q2', key: 'onset', type: 'single',
    question: q('When did the pain start?', 'दर्द कब शुरू हुआ?'),
    options: [
      l('sudden', 'Suddenly (seconds/minutes)', 'अचानक', 'Sudden onset', true),
      l('gradual', 'Gradually over hours', 'धीरे-धीरे', 'Gradual onset'),
      l('exertion', 'During physical activity', 'शारीरिक गतिविधि के दौरान', 'Exertional'),
      l('waking', 'Woke me from sleep', 'नींद से जगाया', 'Nocturnal', true),
    ],
  },
  {
    id: 'cp_q3', key: 'character', type: 'single',
    question: q('How does the pain feel?', 'दर्द कैसा लगता है?'),
    options: [
      l('crushing', 'Crushing / Heavy / Tight', 'दबाने वाला / भारी', 'Crushing', true),
      l('sharp', 'Sharp / Stabbing', 'चुभने वाला', 'Sharp'),
      l('burning', 'Burning', 'जलन', 'Burning'),
      l('pressure', 'Pressure / Squeezing', 'दबाव', 'Pressure', true),
    ],
  },
  {
    id: 'cp_q4', key: 'associated', type: 'multi',
    question: q('Do you also have these symptoms?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('sob', 'Shortness of breath', 'सांस फूलना', 'Dyspnea', true),
      l('sweating', 'Cold sweats', 'ठंडा पसीना', 'Diaphoresis', true),
      l('nausea', 'Nausea / Vomiting', 'मतली / उल्टी', 'Nausea'),
      l('dizziness', 'Dizziness / Fainting', 'चक्कर', 'Dizziness', true),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'cp_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
  {
    id: 'cp_q6', key: 'timing', type: 'single',
    question: q('How long does the pain last?', 'दर्द कितनी देर रहता है?'),
    options: [
      l('seconds', 'Seconds', 'कुछ सेकंड', 'Seconds'),
      l('minutes', '5–20 minutes', '5–20 मिनट', 'Minutes'),
      l('prolonged', 'More than 20 minutes', '20 मिनट से ज़्यादा', '>20min', true),
      l('constant', 'Constant', 'लगातार', 'Constant', true),
    ],
  },
]

// ─────────────────────────────────────────────
// 2. HEADACHE
// ─────────────────────────────────────────────
export const headacheFlow = [
  {
    id: 'ha_q1', key: 'onset', type: 'single',
    question: q('How did the headache start?', 'सिरदर्द कैसे शुरू हुआ?'),
    options: [
      l('thunderclap', 'Sudden — worst ever, like a thunderclap', 'अचानक — जीवन का सबसे तेज़ दर्द', 'Thunderclap', true),
      l('gradual', 'Gradually over minutes/hours', 'धीरे-धीरे', 'Gradual'),
      l('chronic', 'Slow, recurring over days/weeks', 'पुराना / बार-बार होने वाला', 'Chronic'),
    ],
  },
  {
    id: 'ha_q2', key: 'location', type: 'single',
    question: q('Where is the headache?', 'सिरदर्द कहाँ है?'),
    options: [
      l('whole', 'Whole head', 'पूरे सिर में', 'Diffuse'),
      l('front', 'Forehead / Behind eyes', 'माथे पर / आँखों के पीछे', 'Frontal'),
      l('one_side', 'One side of the head', 'सिर के एक तरफ', 'Unilateral'),
      l('back', 'Back of the head / neck', 'सिर के पीछे / गर्दन में', 'Occipital'),
    ],
  },
  {
    id: 'ha_q3', key: 'associated', type: 'multi',
    question: q('Do you have these other symptoms?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('vomiting', 'Vomiting / Nausea', 'उल्टी / मतली', 'Vomiting'),
      l('vision', 'Vision changes / Blurring', 'आँखों में धुंधलापन', 'Vision changes', true),
      l('stiff_neck', 'Stiff neck / can\'t bend neck', 'गर्दन अकड़ना', 'Neck stiffness', true),
      l('fever', 'Fever with the headache', 'बुखार के साथ', 'Fever', true),
      l('light', 'Sensitivity to light', 'तेज़ रोशनी से तकलीफ', 'Photophobia'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ha_q4', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Headache severity (1–10)?', 'सिरदर्द कितना तेज़? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
  {
    id: 'ha_q5', key: 'history', type: 'multi',
    question: q('Any of these apply to you?', 'क्या इनमें से कोई लागू होता है?'),
    options: [
      l('migraine', 'Known migraine sufferer', 'पहले से माइग्रेन है', 'Known migraine'),
      l('hypertension', 'High blood pressure', 'हाई ब्लड प्रेशर', 'Hypertension'),
      l('recent_head', 'Recent head injury', 'हाल ही में सिर में चोट', 'Head trauma', true),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
]

// ─────────────────────────────────────────────
// 3. FEVER
// ─────────────────────────────────────────────
export const feverFlow = [
  {
    id: 'fv_q1', key: 'temperature', type: 'single',
    question: q('What is your approximate temperature?', 'बुखार कितना है?'),
    options: [
      l('low', 'Below 101°F / 38.3°C (mild)', '101°F से कम (हल्का)', 'Low grade'),
      l('mod', '101–103°F / 38.3–39.4°C', '101–103°F (मध्यम)', 'Moderate'),
      l('high', 'Above 103°F / 39.4°C', '103°F से ज़्यादा (तेज़)', 'High grade', true),
      l('unknown', "Don't know", 'पता नहीं', 'Unknown'),
    ],
  },
  {
    id: 'fv_q2', key: 'duration', type: 'single',
    question: q('How long have you had fever?', 'बुखार कितने समय से है?'),
    options: [
      l('1day', 'Less than 1 day', '1 दिन से कम', '<1 day'),
      l('3days', '1–3 days', '1–3 दिन', '1-3 days'),
      l('week', '4–7 days', '4–7 दिन', '4-7 days', true),
      l('long', 'More than 1 week', '1 हफ्ते से ज़्यादा', '>1 week', true),
    ],
  },
  {
    id: 'fv_q3', key: 'associated', type: 'multi',
    question: q('Which of these do you also have?', 'इनमें से कौन से लक्षण भी हैं?'),
    options: [
      l('rash', 'Skin rash', 'त्वचा पर दाने', 'Rash', true),
      l('chills', 'Chills / Rigors', 'कंपकंपी / ठंड लगना', 'Rigors'),
      l('confusion', 'Confusion / Drowsiness', 'घबराहट / उनींदापन', 'Altered consciousness', true),
      l('vomiting', 'Vomiting / Diarrhea', 'उल्टी / दस्त', 'GI symptoms'),
      l('body_ache', 'Body ache / Joint pain', 'बदन दर्द / जोड़ों में दर्द', 'Myalgia'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'fv_q4', key: 'travel', type: 'single',
    question: q('Any recent travel or mosquito exposure?', 'हाल में यात्रा या मच्छर का संपर्क?'),
    options: [
      l('yes_malaria', 'Travel to malaria-prone area', 'मलेरिया क्षेत्र में यात्रा', 'Malaria risk', true),
      l('yes_dengue', 'Dengue-prone area / many mosquitoes', 'डेंगू क्षेत्र', 'Dengue risk'),
      l('no', 'No travel / no specific exposure', 'नहीं', 'No travel'),
    ],
  },
  {
    id: 'fv_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How sick do you feel overall (1–10)?', 'आप कुल मिलाकर कितना बीमार महसूस कर रहे हैं? (1–10)'),
    labels: { en: ['Fine','','','Unwell','','','Very sick','','','Extremely ill'], hi: ['ठीक','','','अस्वस्थ','','','बहुत बीमार','','','बेहद बीमार'] },
  },
]

// ─────────────────────────────────────────────
// 4. ABDOMINAL PAIN
// ─────────────────────────────────────────────
export const abdominalPainFlow = [
  {
    id: 'ab_q1', key: 'location', type: 'single',
    question: q('Where is the stomach pain?', 'पेट में दर्द कहाँ है?'),
    options: [
      l('upper_right', 'Upper right (under ribs)', 'ऊपर दाईं तरफ (पसलियों के नीचे)', 'RUQ'),
      l('upper_left', 'Upper left / stomach area', 'ऊपर बाईं तरफ / पेट', 'LUQ/Epigastric'),
      l('lower_right', 'Lower right', 'नीचे दाईं तरफ', 'RLQ', true),
      l('lower_left', 'Lower left', 'नीचे बाईं तरफ', 'LLQ'),
      l('whole', 'Whole abdomen', 'पूरा पेट', 'Diffuse', true),
    ],
  },
  {
    id: 'ab_q2', key: 'character', type: 'single',
    question: q('How does the pain feel?', 'दर्द कैसा है?'),
    options: [
      l('crampy', 'Crampy / Colicky (comes and goes)', 'ऐंठन / मरोड़ (आता-जाता रहता है)', 'Colicky'),
      l('constant', 'Constant / Dull ache', 'लगातार / सुस्त दर्द', 'Constant'),
      l('sharp', 'Sharp / Stabbing', 'चुभने वाला', 'Sharp', true),
      l('burning', 'Burning', 'जलन', 'Burning'),
    ],
  },
  {
    id: 'ab_q3', key: 'associated', type: 'multi',
    question: q('Which other symptoms do you have?', 'और कौन से लक्षण हैं?'),
    options: [
      l('vomiting', 'Vomiting / Nausea', 'उल्टी / मतली', 'Vomiting'),
      l('blood_stool', 'Blood in stool', 'मल में खून', 'Rectal bleeding', true),
      l('fever', 'Fever', 'बुखार', 'Fever', true),
      l('rigid', 'Abdomen is hard/rigid', 'पेट कड़ा हो गया है', 'Rigid abdomen', true),
      l('no_bowel', 'No bowel movement for >2 days', '2 दिन से शौच नहीं', 'Obstipation', true),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ab_q4', key: 'duration', type: 'single',
    question: q('How long have you had this pain?', 'यह दर्द कब से है?'),
    options: [
      l('hours', 'A few hours', 'कुछ घंटे', 'Hours'),
      l('day', 'About 1 day', 'लगभग 1 दिन', '1 day'),
      l('days', '2–3 days', '2–3 दिन', '2-3 days', true),
      l('weeks', 'More than a week', '1 हफ्ते से ज़्यादा', '>1 week'),
    ],
  },
  {
    id: 'ab_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// ─────────────────────────────────────────────
// 5. SHORTNESS OF BREATH
// ─────────────────────────────────────────────
export const breathingFlow = [
  {
    id: 'br_q1', key: 'onset', type: 'single',
    question: q('When did breathing difficulty start?', 'सांस लेने में तकलीफ कब से है?'),
    options: [
      l('sudden', 'Suddenly (last few minutes/hours)', 'अचानक (कुछ मिनट/घंटे पहले)', 'Sudden onset', true),
      l('gradual', 'Gradually over days', 'धीरे-धीरे (कुछ दिनों में)', 'Gradual'),
      l('exertion', 'Only during activity/walking', 'चलने-फिरने पर ही', 'Exertional'),
      l('rest', 'Even at rest', 'आराम में भी', 'At rest', true),
    ],
  },
  {
    id: 'br_q2', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How difficult is breathing right now (1–10)?', 'अभी सांस लेना कितना मुश्किल है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Can\'t breathe'], hi: ['हल्का','','','मध्यम','','','तेज़','','','बिल्कुल नहीं'] },
  },
  {
    id: 'br_q3', key: 'associated', type: 'multi',
    question: q('Do you also have these symptoms?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('blue_lips', 'Bluish lips or fingertips', 'होंठ या उँगलियाँ नीली पड़ रही हैं', 'Cyanosis', true),
      l('chest_pain', 'Chest pain or tightness', 'सीने में दर्द या जकड़न', 'Chest pain', true),
      l('wheezing', 'Wheezing / whistling sound', 'सांस में घरघराहट', 'Wheeze'),
      l('cough', 'Cough with phlegm', 'बलगम के साथ खांसी', 'Productive cough'),
      l('leg_swelling', 'Swelling in legs / ankles', 'पैरों में सूजन', 'Edema', true),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'br_q4', key: 'history', type: 'multi',
    question: q('Do you have any of these conditions?', 'क्या ये बीमारियाँ हैं?'),
    options: [
      l('asthma', 'Asthma', 'अस्थमा / दमा', 'Asthma'),
      l('copd', 'COPD / Emphysema (smoker)', 'सीओपीडी / धूम्रपान', 'COPD'),
      l('heart', 'Heart disease', 'हृदय रोग', 'Heart disease'),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
]

// ─────────────────────────────────────────────
// 6. JOINT PAIN / ARTHRITIS
// ─────────────────────────────────────────────
export const jointPainFlow = [
  {
    id: 'jp_q1', key: 'location', type: 'multi',
    question: q('Which joints are affected?', 'कौन से जोड़ों में दर्द है?'),
    options: [
      l('knee', 'Knee(s)', 'घुटना', 'Knee'),
      l('hip', 'Hip', 'कूल्हा', 'Hip'),
      l('shoulder', 'Shoulder', 'कंधा', 'Shoulder'),
      l('hand', 'Hand / Wrist / Fingers', 'हाथ / कलाई / उँगलियाँ', 'Hand/Wrist'),
      l('ankle', 'Ankle / Foot', 'टखना / पैर', 'Ankle'),
      l('spine', 'Spine / Back', 'रीढ़', 'Spine'),
    ],
  },
  {
    id: 'jp_q2', key: 'character', type: 'single',
    question: q('What does the joint look like?', 'जोड़ कैसा दिखता है?'),
    options: [
      l('hot_red', 'Hot, red, very swollen (one joint)', 'गर्म, लाल, बहुत सूजा (एक जोड़)', 'Hot/Red joint', true),
      l('swollen', 'Swollen but not hot', 'सूजा लेकिन गर्म नहीं', 'Swollen'),
      l('stiff', 'Stiff, especially in morning', 'अकड़न, खासकर सुबह', 'Morning stiffness'),
      l('normal', 'Looks normal but hurts', 'दिखने में ठीक पर दर्द है', 'Normal appearance'),
    ],
  },
  {
    id: 'jp_q3', key: 'associated', type: 'multi',
    question: q('Do you also have these?', 'क्या ये भी हैं?'),
    options: [
      l('fever', 'Fever with joint pain', 'जोड़ों के साथ बुखार', 'Fever with arthritis', true),
      l('trauma', 'Recent injury / fall', 'हाल में चोट / गिरना', 'Trauma', true),
      l('rash', 'Skin rash', 'त्वचा पर दाने', 'Rash'),
      l('multiple', 'Multiple joints affected', 'कई जोड़ों में दर्द', 'Polyarthritis'),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'jp_q4', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// ─────────────────────────────────────────────
// 7. BACK PAIN
// ─────────────────────────────────────────────
export const backPainFlow = [
  {
    id: 'bp_q1', key: 'location', type: 'single',
    question: q('Where is the back pain?', 'पीठ दर्द कहाँ है?'),
    options: [
      l('upper', 'Upper back (between shoulder blades)', 'ऊपरी पीठ', 'Upper back'),
      l('lower', 'Lower back / lumbar', 'कमर / पीठ के नीचे', 'Lower back'),
      l('tailbone', 'Tailbone / buttocks', 'दुम / नितंब', 'Sacrococcygeal'),
      l('radiating', 'Radiating down the leg', 'पैर तक जाता है', 'Sciatica', true),
    ],
  },
  {
    id: 'bp_q2', key: 'cause', type: 'single',
    question: q('What do you think caused it?', 'दर्द की वजह क्या लगती है?'),
    options: [
      l('lifting', 'Heavy lifting / sudden twist', 'भारी उठाना / अचानक मुड़ना', 'Mechanical'),
      l('trauma', 'Fall or accident', 'गिरना या दुर्घटना', 'Trauma', true),
      l('gradual', 'No specific cause, gradual', 'कोई कारण नहीं, धीरे-धीरे', 'Gradual'),
      l('night', 'Worse at night / wakes from sleep', 'रात में बढ़ता है', 'Night pain', true),
    ],
  },
  {
    id: 'bp_q3', key: 'redflags', type: 'multi',
    question: q('Do you have any of these serious symptoms?', 'क्या ये गंभीर लक्षण भी हैं?'),
    options: [
      l('bladder', 'Difficulty urinating or loss of bladder control', 'पेशाब करने में तकलीफ / रुकावट', 'Bladder dysfunction', true),
      l('bowel', 'Loss of bowel control', 'शौच पर नियंत्रण नहीं', 'Bowel dysfunction', true),
      l('numbness', 'Numbness / weakness in both legs', 'दोनों पैरों में सुन्नपन / कमज़ोरी', 'Bilateral neurology', true),
      l('weight_loss', 'Unexplained weight loss', 'अनजाने में वज़न घटना', 'Weight loss', true),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'bp_q4', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// ─────────────────────────────────────────────
// 8. DIABETES SYMPTOMS
// ─────────────────────────────────────────────
export const diabetesFlow = [
  {
    id: 'db_q1', key: 'known', type: 'single',
    question: q('Do you have diagnosed diabetes?', 'क्या आपको डायबिटीज़ है?'),
    options: [
      l('yes_t2', 'Yes, Type 2 (tablet)', 'हाँ, टाइप 2 (गोली)', 'Known T2DM'),
      l('yes_t1', 'Yes, Type 1 (insulin)', 'हाँ, टाइप 1 (इंसुलिन)', 'Known T1DM'),
      l('new', 'Not diagnosed, but suspect it', 'नहीं, लेकिन शक है', 'Undiagnosed'),
      l('no', 'No diabetes', 'नहीं', 'No DM'),
    ],
  },
  {
    id: 'db_q2', key: 'symptoms', type: 'multi',
    question: q('Which of these are you experiencing?', 'इनमें से कौन से लक्षण हैं?'),
    options: [
      l('thirst', 'Excessive thirst', 'बहुत ज़्यादा प्यास', 'Polydipsia'),
      l('urine', 'Passing a lot of urine', 'बार-बार पेशाब', 'Polyuria'),
      l('weight', 'Unexplained weight loss', 'वज़न घट रहा है', 'Weight loss'),
      l('blurry', 'Blurred vision', 'धुंधला दिखना', 'Vision', true),
      l('wound', 'Wounds not healing', 'घाव नहीं भरता', 'Poor healing'),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'db_q3', key: 'urgent', type: 'multi',
    question: q('Do you have any of these RIGHT NOW?', 'अभी इनमें से कोई लक्षण है?'),
    options: [
      l('vomiting', 'Vomiting + weakness + very high sugar', 'उल्टी + कमज़ोरी + बहुत ज़्यादा शुगर', 'DKA risk', true),
      l('hypo', 'Sweating, shaking, confused (low sugar)', 'पसीना, कंपन, घबराहट (शुगर कम)', 'Hypoglycemia', true),
      l('foot', 'Foot wound / ulcer with redness/pus', 'पैर में घाव / लालिमा / मवाद', 'Diabetic foot', true),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'db_q4', key: 'control', type: 'single',
    question: q('How is your blood sugar control?', 'ब्लड शुगर कंट्रोल में है?'),
    options: [
      l('good', 'Well controlled (regular checkups)', 'अच्छा कंट्रोल', 'Controlled'),
      l('poor', 'Poorly controlled / irregular medicines', 'खराब / अनियमित दवा', 'Uncontrolled', true),
      l('unknown', 'Not monitoring', 'पता नहीं / जाँच नहीं', 'Unknown'),
    ],
  },
]

// ─────────────────────────────────────────────
// 9. DIZZINESS / VERTIGO
// ─────────────────────────────────────────────
export const dizzinessFlow = [
  {
    id: 'dz_q1', key: 'type', type: 'single',
    question: q('What does the dizziness feel like?', 'चक्कर कैसा लगता है?'),
    options: [
      l('spinning', 'Room spinning / vertigo', 'कमरा घूमता लगता है', 'Vertigo'),
      l('lightheaded', 'Lightheaded / about to faint', 'बेहोशी जैसा / फेंट', 'Presyncope', true),
      l('imbalance', 'Loss of balance while walking', 'चलते समय लड़खड़ाना', 'Imbalance'),
      l('floating', 'Floating / foggy feeling', 'तैरने जैसा एहसास', 'Non-specific'),
    ],
  },
  {
    id: 'dz_q2', key: 'onset', type: 'single',
    question: q('When does dizziness happen?', 'चक्कर कब आता है?'),
    options: [
      l('sudden', 'Sudden onset at rest', 'अचानक, आराम में', 'Sudden', true),
      l('position', 'On changing position (lying to sitting)', 'उठने-बैठने पर', 'Positional'),
      l('continuous', 'Continuous / constant', 'लगातार', 'Continuous'),
      l('episodes', 'Comes and goes in episodes', 'कभी-कभी आता है', 'Episodic'),
    ],
  },
  {
    id: 'dz_q3', key: 'associated', type: 'multi',
    question: q('Do you also have these?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('hearing', 'Hearing loss / ringing in ear', 'कम सुनाई / कान में आवाज़', 'Hearing loss'),
      l('facial_droop', 'Face drooping / weakness / slurred speech', 'चेहरा लटकना / कमज़ोरी / बोलने में दिक्कत', 'Stroke symptoms', true),
      l('headache', 'Severe headache', 'तेज़ सिरदर्द', 'Headache', true),
      l('nausea', 'Nausea / Vomiting', 'मतली / उल्टी', 'Nausea'),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'dz_q4', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How severe is the dizziness (1–10)?', 'चक्कर कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Can\'t stand'], hi: ['हल्का','','','मध्यम','','','तेज़','','','खड़े नहीं हो सकते'] },
  },
]

// ─────────────────────────────────────────────
// 10. COUGH
// ─────────────────────────────────────────────
export const coughFlow = [
  {
    id: 'cg_q1', key: 'duration', type: 'single',
    question: q('How long have you had the cough?', 'खांसी कब से है?'),
    options: [
      l('days', 'Less than 2 weeks', '2 हफ्ते से कम', 'Acute'),
      l('weeks', '2–8 weeks', '2–8 हफ्ते', 'Subacute'),
      l('chronic', 'More than 8 weeks', '8 हफ्ते से ज़्यादा', 'Chronic', true),
    ],
  },
  {
    id: 'cg_q2', key: 'character', type: 'single',
    question: q('What is the cough like?', 'खांसी कैसी है?'),
    options: [
      l('dry', 'Dry / No phlegm', 'सूखी खांसी', 'Dry'),
      l('wet', 'Wet / with phlegm (white/yellow)', 'बलगम के साथ (सफेद/पीला)', 'Productive'),
      l('blood', 'Blood in sputum', 'खून का बलगम', 'Hemoptysis', true),
      l('night', 'Mostly at night', 'रात को ज़्यादा', 'Nocturnal'),
    ],
  },
  {
    id: 'cg_q3', key: 'associated', type: 'multi',
    question: q('Do you also have these?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('weight_loss', 'Unexplained weight loss', 'वज़न घटना', 'Weight loss', true),
      l('night_sweat', 'Night sweats', 'रात को पसीना', 'Night sweats', true),
      l('sob', 'Shortness of breath', 'सांस फूलना', 'Dyspnea'),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'cg_q4', key: 'risk', type: 'multi',
    question: q('Any of these risk factors?', 'क्या ये जोखिम कारक हैं?'),
    options: [
      l('smoking', 'Smoker or ex-smoker', 'धूम्रपान करते हैं / करते थे', 'Smoking', true),
      l('tb_contact', 'Contact with TB patient', 'टीबी रोगी के संपर्क में', 'TB contact', true),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
]

// ─────────────────────────────────────────────
// 11. SKIN RASH
// ─────────────────────────────────────────────
export const rashFlow = [
  {
    id: 'rh_q1', key: 'appearance', type: 'single',
    question: q('What does the rash look like?', 'दाने कैसे दिखते हैं?'),
    options: [
      l('flat', 'Flat red spots', 'चपटे लाल दाने', 'Macular'),
      l('raised', 'Raised bumps / hives', 'उभरे हुए दाने / खुजली', 'Urticarial'),
      l('blisters', 'Blisters / fluid-filled', 'छाले / पानी वाले दाने', 'Vesicular'),
      l('petechiae', 'Tiny red/purple pinpoint spots (don\'t fade on pressure)', 'छोटे लाल/बैंगनी बिंदु (दबाने पर नहीं जाते)', 'Petechiae', true),
    ],
  },
  {
    id: 'rh_q2', key: 'associated', type: 'multi',
    question: q('Do you also have these symptoms?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('fever', 'Fever with rash', 'बुखार के साथ दाने', 'Fever + rash', true),
      l('itching', 'Itching', 'खुजली', 'Pruritis'),
      l('spreading', 'Rapidly spreading', 'तेज़ी से फैल रहा है', 'Rapidly spreading', true),
      l('breathing', 'Difficulty breathing / throat swelling', 'सांस लेने में तकलीफ / गले में सूजन', 'Anaphylaxis', true),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'rh_q3', key: 'trigger', type: 'single',
    question: q('Did something trigger the rash?', 'दाने किस कारण हुए?'),
    options: [
      l('medication', 'New medication', 'नई दवा', 'Drug reaction', true),
      l('food', 'Specific food', 'कोई खाना', 'Food allergy'),
      l('contact', 'Contact with plants/chemicals', 'पौधे/रसायन का संपर्क', 'Contact dermatitis'),
      l('unknown', 'Unknown', 'पता नहीं', 'Unknown'),
    ],
  },
]

// ─────────────────────────────────────────────
// 12. EYE PROBLEMS
// ─────────────────────────────────────────────
export const eyeFlow = [
  {
    id: 'ey_q1', key: 'main_symptom', type: 'single',
    question: q('What is your main eye complaint?', 'आँखों की मुख्य शिकायत क्या है?'),
    options: [
      l('vision_loss', 'Sudden loss of vision', 'अचानक दिखना बंद हो गया', 'Sudden vision loss', true),
      l('pain_red', 'Painful red eye', 'दर्द के साथ लाल आँख', 'Painful red eye', true),
      l('discharge', 'Discharge / sticky eyes', 'चिपचिपापन / पीला/सफेद स्राव', 'Discharge'),
      l('blurry', 'Gradual blurring of vision', 'धीरे-धीरे धुंधलापन', 'Gradual blur'),
      l('foreign', 'Something in the eye', 'आँख में कुछ पड़ गया', 'Foreign body', true),
    ],
  },
  {
    id: 'ey_q2', key: 'associated', type: 'multi',
    question: q('Do you also have these symptoms?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('headache', 'Severe headache with eye pain', 'आँख दर्द के साथ सिरदर्द', 'Headache', true),
      l('halos', 'Seeing halos around lights', 'रोशनी के चारों ओर गोले दिखना', 'Halos', true),
      l('floaters', 'Floating dark spots', 'काले धब्बे तैरते दिखना', 'Floaters', true),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
]

// ─────────────────────────────────────────────
// 13. URINARY PROBLEMS
// ─────────────────────────────────────────────
export const urinaryFlow = [
  {
    id: 'ur_q1', key: 'main_symptom', type: 'multi',
    question: q('Which urinary symptoms do you have?', 'पेशाब से जुड़ी कौन सी शिकायतें हैं?'),
    options: [
      l('burning', 'Burning / pain while urinating', 'पेशाब में जलन / दर्द', 'Dysuria'),
      l('frequency', 'Very frequent urination', 'बार-बार पेशाब', 'Frequency'),
      l('blood', 'Blood in urine', 'पेशाब में खून', 'Hematuria', true),
      l('no_urine', 'Not passing urine at all', 'पेशाब बंद हो गया है', 'Anuria', true),
      l('flank_pain', 'Severe flank / side pain', 'कमर / पेट के किनारे में तेज़ दर्द', 'Renal colic', true),
    ],
  },
  {
    id: 'ur_q2', key: 'associated', type: 'multi',
    question: q('Do you also have these?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('fever', 'Fever with chills', 'बुखार और ठंड', 'Fever', true),
      l('back_pain', 'Back / kidney area pain', 'पीठ / किडनी वाली जगह दर्द', 'Loin pain', true),
      l('discharge', 'Unusual discharge from genital area', 'जननांग से स्राव', 'Discharge'),
      l('none', 'None', 'कोई नहीं', 'None', false, true),
    ],
  },
]

// ─────────────────────────────────────────────
// 14. ANXIETY / MENTAL HEALTH
// ─────────────────────────────────────────────
export const mentalHealthFlow = [
  {
    id: 'mh_q1', key: 'main_symptom', type: 'single',
    question: q('What is your main concern today?', 'आज मुख्य समस्या क्या है?'),
    options: [
      l('anxiety', 'Excessive worry / anxiety', 'बहुत ज़्यादा चिंता / घबराहट', 'Anxiety'),
      l('panic', 'Sudden panic attacks (heart racing, sweating)', 'अचानक घबराहट के दौरे', 'Panic attacks'),
      l('sad', 'Persistent sadness / depression', 'लगातार उदासी / अवसाद', 'Depression'),
      l('sleep', 'Sleep problems / insomnia', 'नींद की समस्या', 'Insomnia'),
      l('stress', 'Extreme stress from life events', 'जीवन की घटनाओं से तनाव', 'Stress'),
    ],
  },
  {
    id: 'mh_q2', key: 'severity', type: 'single',
    question: q('How much is this affecting your daily life?', 'यह आपकी रोज़मर्रा की ज़िंदगी को कितना प्रभावित कर रहा है?'),
    options: [
      l('mild', 'Mild — I manage fine', 'हल्का — ठीक से चल रहा है', 'Mild'),
      l('moderate', 'Moderate — some difficulty', 'मध्यम — थोड़ी दिक्कत', 'Moderate'),
      l('severe', 'Severe — can\'t function normally', 'गंभीर — सामान्य काम नहीं हो पा रहा', 'Severe', true),
    ],
  },
  {
    id: 'mh_q3', key: 'safety', type: 'single',
    question: q('Do you have any thoughts of harming yourself?', 'क्या खुद को नुकसान पहुँचाने के विचार आते हैं?'),
    options: [
      l('no', 'No — no such thoughts', 'नहीं', 'No SI'),
      l('passive', 'Sometimes wish things were over, but no plan', 'कभी-कभी ऐसा लगता है, पर कोई योजना नहीं', 'Passive SI', true),
      l('active', 'Yes — have thoughts of ending life', 'हाँ — जीवन समाप्त करने के विचार', 'Active SI', true),
    ],
  },
]

// ─────────────────────────────────────────────
// 15. GENERAL WEAKNESS / FATIGUE
// ─────────────────────────────────────────────
export const fatigueFlow = [
  {
    id: 'ft_q1', key: 'duration', type: 'single',
    question: q('How long have you felt weak or fatigued?', 'कमज़ोरी / थकान कब से है?'),
    options: [
      l('days', 'Less than 2 weeks', '2 हफ्ते से कम', 'Acute'),
      l('weeks', '2 weeks – 3 months', '2 हफ्ते से 3 महीने', 'Subacute'),
      l('months', 'More than 3 months', '3 महीने से ज़्यादा', 'Chronic', true),
    ],
  },
  {
    id: 'ft_q2', key: 'associated', type: 'multi',
    question: q('Do you also have these?', 'क्या ये लक्षण भी हैं?'),
    options: [
      l('weight_loss', 'Unexplained weight loss', 'अनजाने में वज़न घटना', 'Weight loss', true),
      l('night_sweats', 'Night sweats', 'रात को पसीना', 'Night sweats', true),
      l('bleeding', 'Unusual bleeding / bruising', 'असामान्य खून बहना / नील पड़ना', 'Bleeding', true),
      l('swollen_nodes', 'Swollen glands / lumps', 'गाँठें / सूजी हुई ग्रंथियाँ', 'Lymphadenopathy', true),
      l('pale', 'Pale skin / feeling very anemic', 'पीला रंग / एनीमिया', 'Pallor'),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ft_q3', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How severe is your fatigue (1–10)?', 'थकान कितनी गंभीर है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Can\'t get up'], hi: ['हल्का','','','मध्यम','','','तेज़','','','उठ नहीं सकते'] },
  },
]

// ─────────────────────────────────────────────
// Registry — maps condition ID → flow
// ─────────────────────────────────────────────
export const DISEASE_FLOWS = {
  chest_pain:     chestPainFlow,
  headache:       headacheFlow,
  fever:          feverFlow,
  abdominal_pain: abdominalPainFlow,
  breathing:      breathingFlow,
  joint_pain:     jointPainFlow,
  back_pain:      backPainFlow,
  diabetes:       diabetesFlow,
  dizziness:      dizzinessFlow,
  cough:          coughFlow,
  skin_rash:      rashFlow,
  eye_problems:   eyeFlow,
  urinary:        urinaryFlow,
  mental_health:  mentalHealthFlow,
  fatigue:        fatigueFlow,
}

// ─────────────────────────────────────────────
// Condition metadata for the Symptom Picker UI
// ─────────────────────────────────────────────
export const CONDITIONS = [
  { id: 'chest_pain',     en: 'Chest Pain',          hi: 'सीने में दर्द',       emoji: '🫀', color: 'red' },
  { id: 'headache',       en: 'Headache',             hi: 'सिरदर्द',             emoji: '🧠', color: 'purple' },
  { id: 'fever',          en: 'Fever',                hi: 'बुखार',               emoji: '🌡️', color: 'orange' },
  { id: 'abdominal_pain', en: 'Abdominal Pain',       hi: 'पेट दर्द',            emoji: '🫁', color: 'yellow' },
  { id: 'breathing',      en: 'Breathing Difficulty', hi: 'सांस की तकलीफ',       emoji: '💨', color: 'blue' },
  { id: 'joint_pain',     en: 'Joint / Bone Pain',    hi: 'जोड़ों / हड्डियों में दर्द', emoji: '🦴', color: 'indigo' },
  { id: 'back_pain',      en: 'Back Pain',            hi: 'पीठ / कमर दर्द',      emoji: '🔩', color: 'slate' },
  { id: 'diabetes',       en: 'Diabetes Symptoms',    hi: 'डायबिटीज़ के लक्षण',  emoji: '🩸', color: 'pink' },
  { id: 'dizziness',      en: 'Dizziness',            hi: 'चक्कर आना',           emoji: '💫', color: 'teal' },
  { id: 'cough',          en: 'Cough',                hi: 'खांसी',               emoji: '🤧', color: 'green' },
  { id: 'skin_rash',      en: 'Skin Rash',            hi: 'त्वचा के दाने',        emoji: '🌸', color: 'rose' },
  { id: 'eye_problems',   en: 'Eye Problems',         hi: 'आँखों की समस्या',     emoji: '👁️', color: 'cyan' },
  { id: 'urinary',        en: 'Urinary Problems',     hi: 'पेशाब की समस्या',     emoji: '💧', color: 'sky' },
  { id: 'mental_health',  en: 'Anxiety / Mental Health', hi: 'चिंता / मानसिक स्वास्थ्य', emoji: '🧘', color: 'violet' },
  { id: 'fatigue',        en: 'Weakness / Fatigue',   hi: 'कमज़ोरी / थकान',      emoji: '⚡', color: 'amber' },
]
