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
// DEDICATED FLOWS for extended conditions
// Each asks about the SELECTED condition only — never another disease.
// ─────────────────────────────────────────────

// HIGH BLOOD PRESSURE
export const hypertensionFlow = [
  {
    id: 'bp_q1', key: 'reading', type: 'single',
    question: q('What are your recent BP readings (upper/lower)?', 'आपका हाल का बीपी कितना आता है? (ऊपर/नीचे)'),
    options: [
      l('dontknow', "Don't know — never checked", 'पता नहीं — कभी जांचा नहीं', 'Unknown'),
      l('normal', 'Below 140/90', '140/90 से कम', 'Below 140/90'),
      l('high', '140/90 to 160/100', '140/90 से 160/100 तक', 'Stage 1 high'),
      l('vhigh', 'Above 160/100', '160/100 से ऊपर', 'Stage 2 high', true),
      l('crisis', 'Above 180/110', '180/110 से ऊपर', 'Hypertensive crisis', true),
    ],
  },
  {
    id: 'bp_q2', key: 'associated', type: 'multi',
    question: q('Do you feel any of these RIGHT NOW?', 'क्या इस समय इनमें से कुछ महसूस हो रहा है?'),
    options: [
      l('headache', 'Severe headache', 'तेज़ सिरदर्द', 'Headache'),
      l('dizzy', 'Dizziness', 'चक्कर', 'Dizziness'),
      l('chest', 'Chest pain or tightness', 'सीने में दर्द या जकड़न', 'Chest discomfort', true),
      l('breath', 'Breathlessness', 'सांस फूलना', 'Dyspnea', true),
      l('vision', 'Blurred vision', 'धुंधला दिखना', 'Visual disturbance', true),
      l('none', 'None — I feel normal', 'कुछ नहीं — सामान्य लग रहा है', 'None', false, true),
    ],
  },
  {
    id: 'bp_q3', key: 'history', type: 'multi',
    question: q('Which of these apply to you?', 'इनमें से क्या आप पर लागू होता है?'),
    options: [
      l('known', 'Already diagnosed with high BP', 'पहले से हाई BP है', 'Known hypertensive'),
      l('medicine', 'Taking BP medicine regularly', 'रोज़ BP की दवा लेते हैं', 'On treatment'),
      l('stopped', 'Stopped BP medicine on my own', 'दवा खुद से बंद कर दी', 'Stopped medicine', true),
      l('diabetes', 'Diabetes', 'डायबिटीज', 'Diabetes'),
      l('smoke', 'Smoking / tobacco / alcohol', 'धूम्रपान / तंबाकू / शराब', 'Risk habits'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'bp_q4', key: 'duration', type: 'single',
    question: q('Since when is your BP high?', 'BP बढ़ा हुआ कब से है?'),
    options: [
      l('today', 'Found high today itself', 'आज ही ज़्यादा मिला', 'New detection'),
      l('weeks', 'Few weeks', 'कुछ हफ्तों से', 'Weeks'),
      l('months', 'Months / years', 'महीनों / सालों से', 'Chronic'),
    ],
  },
  {
    id: 'bp_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How bad do you feel right now (1–10)?', 'इस समय कितना खराब लग रहा है? (1–10)'),
    labels: { en: ['Fine','','','Uneasy','','','Bad','','','Worst'], hi: ['ठीक','','','बेचैनी','','','खराब','','','बहुत खराब'] },
  },
]

// PALPITATIONS
export const palpitationsFlow = [
  {
    id: 'pal_q1', key: 'trigger', type: 'single',
    question: q('When does the fast heartbeat happen?', 'तेज़ धड़कन कब होती है?'),
    options: [
      l('rest', 'Even at rest', 'आराम करते समय भी', 'At rest'),
      l('exertion', 'On exertion / climbing stairs', 'चलने / सीढ़ी चढ़ने पर', 'Exertional'),
      l('stimulant', 'After tea, coffee or smoking', 'चाय, कॉफी या सिगरेट के बाद', 'Stimulant'),
      l('sudden', 'Suddenly, without reason', 'अचानक, बिना कारण', 'Sudden onset', true),
    ],
  },
  {
    id: 'pal_q2', key: 'character', type: 'single',
    question: q('How does the heartbeat feel?', 'धड़कन कैसी लगती है?'),
    options: [
      l('fast', 'Fast and pounding', 'तेज़ व ज़ोर से धड़कना', 'Fast pounding'),
      l('irregular', 'Irregular / skipped beats', 'अनियमित / बीट छूटना', 'Irregular', true),
      l('slowdizzy', 'Slow with dizziness', 'धीमी, चक्कर के साथ', 'Slow with dizziness', true),
      l('withpain', 'Fast with chest pain', 'तेज़, सीने में दर्द के साथ', 'With chest pain', true),
    ],
  },
  {
    id: 'pal_q3', key: 'associated', type: 'multi',
    question: q('What happens along with it?', 'इसके साथ क्या होता है?'),
    options: [
      l('faint', 'Fainting or blackout', 'बेहोशी', 'Syncope', true),
      l('breath', 'Breathlessness', 'सांस फूलना', 'Dyspnea', true),
      l('sweat', 'Sweating', 'पसीना', 'Sweating'),
      l('anxiety', 'Anxiety / fear', 'घबराहट / डर', 'Anxiety'),
      l('none', 'Nothing else', 'और कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'pal_q4', key: 'duration', type: 'single',
    question: q('How long does each episode last?', 'हर दौर कितनी देर रहता है?'),
    options: [
      l('seconds', 'Few seconds', 'कुछ सेकंड', 'Seconds'),
      l('minutes', 'Few minutes', 'कुछ मिनट', 'Minutes'),
      l('hours', 'Hours', 'घंटों', 'Hours', true),
      l('always', 'Almost always feeling it', 'लगभग हमेशा', 'Persistent', true),
    ],
  },
  {
    id: 'pal_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How disturbing is it (1–10)?', 'कितनी परेशानी होती है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Frightening'], hi: ['हल्का','','','मध्यम','','','तेज़','','','डरावना'] },
  },
]

// SEIZURE
export const seizureFlow = [
  {
    id: 'sz_q1', key: 'character', type: 'single',
    question: q('What happened during the episode?', 'दौरे के समय क्या हुआ?'),
    options: [
      l('generalized', 'Full body shaking with unconsciousness', 'बेहोशी के साथ पूरे शरीर में झटके', 'Generalized', true),
      l('staring', 'Blank staring for seconds', 'कुछ सेकंड एकटक देखना', 'Absence'),
      l('focal', 'Jerks in one hand / leg / face', 'एक हाथ-पैर / चेहरे में झटके', 'Focal'),
      l('fallonly', 'Sudden fall without shaking', 'बिना झटके अचानक गिरना', 'Drop', true),
    ],
  },
  {
    id: 'sz_q2', key: 'duration', type: 'single',
    question: q('How long did it last?', 'कितनी देर रहा?'),
    options: [
      l('sec', 'Less than 1 minute', '1 मिनट से कम', '<1 min'),
      l('min15', '1 to 5 minutes', '1 से 5 मिनट', '1-5 min'),
      l('more5', 'More than 5 minutes', '5 मिनट से ज़्यादा', '>5 min', true),
      l('unknown', "Don't know", 'पता नहीं', 'Unknown'),
    ],
  },
  {
    id: 'sz_q3', key: 'associated', type: 'multi',
    question: q('What else happened?', 'और क्या हुआ?'),
    options: [
      l('tongue', 'Tongue bite / bleeding mouth', 'जीभ कटना / मुंह से खून', 'Tongue bite', true),
      l('bladder', 'Urine passed during episode', 'दौरे में पेशाब निकलना', 'Incontinence', true),
      l('injury', 'Injury from falling', 'गिरने से चोट', 'Injury', true),
      l('confusion', 'Confusion lasting over 30 minutes after', 'आधे घंटे से ज़्यादा भ्रम', 'Prolonged confusion', true),
      l('fever', 'Fever before the episode', 'दौरे से पहले बुखार', 'Febrile'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'sz_q4', key: 'history', type: 'multi',
    question: q('Which of these apply?', 'इनमें से क्या लागू होता है?'),
    options: [
      l('first', 'First episode ever', 'पहला दौरा है', 'First episode', true),
      l('repeat', 'Episodes keep repeating', 'दौरे बार-बार आते हैं', 'Recurrent', true),
      l('missed', 'Missed epilepsy medicine dose', 'मिर्गी की दवा छूटी', 'Missed dose'),
      l('headinjury', 'Recent head injury', 'हाल में सिर में चोट', 'Head injury', true),
      l('alcohol', 'Alcohol use', 'शराब का सेवन', 'Alcohol'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
]

// EAR PAIN
export const earPainFlow = [
  {
    id: 'ear_q1', key: 'site', type: 'single',
    question: q('Which ear troubles you?', 'कौन से कान में तकलीफ है?'),
    options: [
      l('left', 'Left ear', 'बायां कान', 'Left'),
      l('right', 'Right ear', 'दायां कान', 'Right'),
      l('both', 'Both ears', 'दोनों कान', 'Both'),
    ],
  },
  {
    id: 'ear_q2', key: 'character', type: 'single',
    question: q('What is the ear problem?', 'कान में क्या तकलीफ है?'),
    options: [
      l('pain', 'Pain only', 'सिर्फ दर्द', 'Pain'),
      l('discharge', 'Water / pus discharge', 'पानी / मवाद बहना', 'Discharge', true),
      l('hearing', 'Reduced hearing / blockage', 'सुनना कम / बंद लगना', 'Hearing loss'),
      l('ringing', 'Ringing with dizziness', 'सीटी + चक्कर', 'Tinnitus with vertigo', true),
    ],
  },
  {
    id: 'ear_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('cold', 'Cold / cough', 'सर्दी / खांसी', 'URI'),
      l('blood', 'Blood in discharge', 'मवाद में खून', 'Bloody discharge', true),
      l('water', 'Water entered recently', 'हाल में पानी गया', 'Water entry'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ear_q4', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('hours', 'Few hours', 'कुछ घंटे', 'Hours'),
      l('days', 'Few days', 'कुछ दिन', 'Days'),
      l('weeks', 'Weeks', 'हफ्तों से', 'Chronic', true),
    ],
  },
  {
    id: 'ear_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Ear pain severity (1–10)?', 'कान दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// SORE THROAT
export const soreThroatFlow = [
  {
    id: 'st_q1', key: 'character', type: 'single',
    question: q('What troubles your throat most?', 'गले में सबसे ज़्यादा क्या तकलीफ है?'),
    options: [
      l('swallow', 'Pain while swallowing', 'निगलने में दर्द', 'Odynophagia'),
      l('scratchy', 'Dry scratchy throat', 'सूखी खराश', 'Scratchy'),
      l('voice', 'Hoarse / lost voice', 'आवाज़ बैठना / बंद होना', 'Hoarseness'),
      l('patches', 'White patches on tonsils', 'टॉन्सिल पर सफेद दाने', 'Exudates', true),
    ],
  },
  {
    id: 'st_q2', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('cough', 'Cough / cold', 'खांसी / सर्दी', 'Cough'),
      l('cantdrink', 'Cannot swallow even water', 'पानी भी नहीं निगल पा रहे', 'Cannot swallow fluids', true),
      l('breathing', 'Noisy breathing / drooling', 'सांस में आवाज़ / लार टपकना', 'Stridor', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'st_q3', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('d12', '1–2 days', '1-2 दिन', 'Acute'),
      l('d37', '3–7 days', '3-7 दिन', 'Subacute'),
      l('week', 'More than a week', 'एक हफ्ते से ज़्यादा', 'Prolonged', true),
    ],
  },
  {
    id: 'st_q4', key: 'history', type: 'multi',
    question: q('Which apply to you?', 'इनमें से क्या लागू होता है?'),
    options: [
      l('smoke', 'Smoking / tobacco', 'धूम्रपान / तंबाकू', 'Tobacco'),
      l('acidity', 'Acidity / reflux burn', 'एसिडिटी / खट्टी डकार', 'Reflux'),
      l('repeat', 'Throat pain keeps repeating', 'गले का दर्द बार-बार होता है', 'Recurrent'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'st_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Throat pain severity (1–10)?', 'गले का दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// THYROID
export const thyroidFlow = [
  {
    id: 'thy_q1', key: 'character', type: 'multi',
    question: q('What changes have you noticed?', 'आपने क्या बदलाव देखे हैं?'),
    options: [
      l('wgain', 'Weight gain', 'वज़न बढ़ना', 'Weight gain'),
      l('wloss', 'Weight loss despite eating', 'खाने पर भी वज़न घटना', 'Weight loss'),
      l('fatigue', 'Constant tiredness', 'लगातार थकान', 'Fatigue'),
      l('neck', 'Neck swelling (goitre)', 'गर्दन में सूजन', 'Goitre'),
      l('tremor', 'Trembling hands / fast heartbeat', 'हाथ कांपना / तेज़ धड़कन', 'Tremor'),
      l('coldheat', 'Feeling too cold or too hot', 'बहुत ठंड या गर्मी लगना', 'Temperature intolerance'),
    ],
  },
  {
    id: 'thy_q2', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('hair', 'Hair fall', 'बाल झड़ना', 'Hair fall'),
      l('bowel', 'Constipation or loose motions', 'कब्ज या दस्त', 'Bowel change'),
      l('menses', 'Irregular periods', 'अनियमित मासिक', 'Menstrual irregularity'),
      l('mood', 'Mood swings / anxiety', 'मूड बदलना / चिंता', 'Mood change'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'thy_q3', key: 'history', type: 'single',
    question: q('Thyroid history?', 'थायरॉइड का इतिहास?'),
    options: [
      l('never', 'Never diagnosed', 'कभी जांच नहीं हुई', 'Undiagnosed'),
      l('hypo', 'Hypothyroid — on medicine', 'हाइपोथायरॉइड — दवा चल रही', 'Hypo on treatment'),
      l('hyper', 'Hyperthyroid — on medicine', 'हाइपरथायरॉइड — दवा चल रही', 'Hyper on treatment'),
      l('stopped', 'Was on medicine, stopped it', 'दवा बंद कर दी', 'Stopped medicine', true),
    ],
  },
  {
    id: 'thy_q4', key: 'duration', type: 'single',
    question: q('Since when are these changes?', 'ये बदलाव कब से हैं?'),
    options: [
      l('weeks', 'Few weeks', 'कुछ हफ्तों से', 'Weeks'),
      l('months', 'Few months', 'कुछ महीनों से', 'Months'),
      l('years', 'Years', 'सालों से', 'Years'),
    ],
  },
  {
    id: 'thy_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How much does it affect daily life (1–10)?', 'रोज़मर्रा पर कितना असर है? (1–10)'),
    labels: { en: ['Little','','','Some','','','Lot','','','Severe'], hi: ['थोड़ा','','','कुछ','','','ज़्यादा','','','बहुत'] },
  },
]

// OBESITY
export const obesityFlow = [
  {
    id: 'ob_q1', key: 'duration', type: 'single',
    question: q('Since when is weight increasing?', 'वज़न बढ़ना कब से है?'),
    options: [
      l('months', 'Few months', 'कुछ महीनों से', 'Months'),
      l('y12', '1–2 years', '1-2 साल से', '1-2 years'),
      l('years', 'Many years', 'कई सालों से', 'Chronic'),
      l('child', 'Since childhood', 'बचपन से', 'Childhood onset'),
    ],
  },
  {
    id: 'ob_q2', key: 'cause', type: 'single',
    question: q('What seems to be the main reason?', 'मुख्य कारण क्या लगता है?'),
    options: [
      l('food', 'Overeating / oily food', 'ज़्यादा खाना / तला-भुना', 'Overeating'),
      l('sweet', 'Sweets / cold drinks', 'मीठा / कोल्ड ड्रिंक', 'Sugar excess'),
      l('noexercise', 'No physical activity', 'बिल्कुल व्यायाम नहीं', 'Sedentary'),
      l('medical', 'Thyroid / PCOS / medicine', 'थायरॉइड / PCOS / दवा', 'Medical cause'),
    ],
  },
  {
    id: 'ob_q3', key: 'associated', type: 'multi',
    question: q('Do you also face?', 'क्या साथ में यह भी है?'),
    options: [
      l('breath', 'Breathlessness on walking', 'चलने पर सांस फूलना', 'Exertional dyspnea', true),
      l('joint', 'Knee / joint pain', 'घुटने / जोड़ों में दर्द', 'Joint pain'),
      l('bpsugar', 'High BP or sugar detected', 'BP या शुगर निकला', 'Metabolic', true),
      l('snore', 'Loud snoring / daytime sleepiness', 'तेज़ खर्राटे / दिन में नींद', 'Sleep apnea'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ob_q4', key: 'attempts', type: 'single',
    question: q('What have you tried so far?', 'अब तक क्या कोशिश की?'),
    options: [
      l('nothing', 'Nothing yet', 'अभी कुछ नहीं', 'No attempt'),
      l('diet', 'Diet control', 'परहेज़', 'Diet'),
      l('exercise', 'Exercise / walking', 'व्यायाम / टहलना', 'Exercise'),
      l('products', 'Weight-loss powders / pills', 'वज़न घटाने वाले पाउडर / गोली', 'Unsupervised products'),
    ],
  },
  {
    id: 'ob_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How much does weight trouble you daily (1–10)?', 'वज़न से रोज़ कितनी परेशानी है? (1–10)'),
    labels: { en: ['Little','','','Some','','','Lot','','','Severe'], hi: ['थोड़ी','','','कुछ','','','ज़्यादा','','','बहुत'] },
  },
]
// Red-flag driven: severity + warning signs decide triage.
// ─────────────────────────────────────────────
export const genericFlow = [
  {
    id: 'gx_q1', key: 'duration', type: 'single',
    question: q('How long have you had this problem?', 'यह समस्या कब से है?'),
    options: [
      l('hours', 'Few hours', 'कुछ घंटे', 'Acute hours'),
      l('days', 'Few days', 'कुछ दिन', 'Acute days'),
      l('weeks', 'Weeks', 'हफ्तों से', 'Subacute'),
      l('months', 'Months or longer', 'महीनों से या ज़्यादा', 'Chronic', true),
    ],
  },
  {
    id: 'gx_q2', key: 'onset', type: 'single',
    question: q('How did it start?', 'शुरुआत कैसे हुई?'),
    options: [
      l('sudden', 'Suddenly', 'अचानक', 'Sudden onset', true),
      l('gradual', 'Gradually', 'धीरे-धीरे', 'Gradual onset'),
      l('recurrent', 'Comes and goes', 'आता-जाता रहता है', 'Recurrent'),
    ],
  },
  {
    id: 'gx_q3', key: 'associated', type: 'multi',
    question: q('Do you have any of these warning signs?', 'क्या इनमें से कोई गंभीर लक्षण है?'),
    options: [
      l('breathing', 'Difficulty breathing', 'सांस लेने में तकलीफ', 'Dyspnea', true),
      l('chestpain', 'Chest pain or pressure', 'सीने में दर्द या दबाव', 'Chest pain', true),
      l('bleeding', 'Unusual bleeding', 'असामान्य खून बहना', 'Bleeding', true),
      l('highfever', 'High fever with chills', 'ठंड लगकर तेज़ बुखार', 'High fever', true),
      l('unconscious', 'Fainting / loss of consciousness', 'बेहोशी', 'Syncope', true),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'gx_q4', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How severe is it (1–10)?', 'कितना गंभीर है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// KIDNEY STONE
export const kidneyStoneFlow = [
  {
    id: 'ks_q1', key: 'site', type: 'single',
    question: q('Where is the pain?', 'दर्द कहाँ है?'),
    options: [
      l('loin', 'Back side (loin)', 'पीछे कमर की ओर', 'Loin'),
      l('front', 'Front abdomen', 'आगे पेट में', 'Anterior abdomen'),
      l('groin', 'Going towards groin / thigh', 'जांघ / निचले हिस्से की ओर जाता है', 'Radiating to groin'),
      l('both', 'Both sides', 'दोनों ओर', 'Bilateral'),
    ],
  },
  {
    id: 'ks_q2', key: 'character', type: 'single',
    question: q('How is the pain?', 'दर्द कैसा है?'),
    options: [
      l('colic', 'Comes in waves (severe then eases)', 'लहरों में आता है (तेज़ फिर कम)', 'Colicky'),
      l('dull', 'Constant dull ache', 'लगातार हल्का दर्द', 'Dull constant'),
      l('burning', 'Burning while urinating', 'पेशाब में जलन', 'Dysuria'),
      l('blood', 'Blood in urine', 'पेशाब में खून', 'Hematuria', true),
    ],
  },
  {
    id: 'ks_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('nausea', 'Nausea / vomiting', 'मतली / उल्टी', 'Nausea'),
      l('fever', 'Fever with chills', 'ठंड लगकर बुखार', 'Fever with chills', true),
      l('urge', 'Frequent urge, little urine', 'बार-बार लगना, थोड़ा आना', 'Frequency with low output', true),
      l('cloudy', 'Cloudy / foul-smelling urine', 'गंदला / बदबूदार पेशाब', 'Cloudy urine'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ks_q4', key: 'history', type: 'multi',
    question: q('Which apply to you?', 'इनमें से क्या लागू होता है?'),
    options: [
      l('before', 'Stone problem earlier too', 'पहले भी पथरी हुई', 'Recurrent stone'),
      l('lesswater', 'Drinking very little water', 'बहुत कम पानी पीना', 'Low intake'),
      l('family', 'Stones in family', 'परिवार में पथरी', 'Family history'),
      l('big', 'Known stone bigger than 8mm', '8mm से बड़ी पथरी पता है', 'Large stone', true),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ks_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// MENSTRUAL PAIN
export const menstrualFlow = [
  {
    id: 'mp_q1', key: 'timing', type: 'single',
    question: q('When is the pain worst?', 'दर्द सबसे ज़्यादा कब होता है?'),
    options: [
      l('before', '1–2 days before periods', 'मासिक से 1-2 दिन पहले', 'Premenstrual'),
      l('first2', 'First 2 days of periods', 'पहले 2 दिन', 'First 2 days'),
      l('all', 'All period days', 'सभी दिनों', 'Throughout'),
      l('month', 'Even without periods, all month', 'बिना मासिक के भी, पूरे महीने', 'Non-cyclical', true),
    ],
  },
  {
    id: 'mp_q2', key: 'bleeding', type: 'single',
    question: q('How is the bleeding?', 'रक्तस्राव कैसा है?'),
    options: [
      l('normal', 'Normal', 'सामान्य', 'Normal'),
      l('heavy', 'Heavy with clots', 'थक्कों के साथ ज़्यादा', 'Heavy with clots'),
      l('hourly', 'Pad soaking every hour', 'हर घंटे पैड भरना', 'Soaking hourly', true),
      l('missed', 'Periods missed — pregnancy possible', 'मासिक रुका — गर्भ संभव', 'Missed — test needed', true),
    ],
  },
  {
    id: 'mp_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('nausea', 'Nausea / vomiting', 'मतली / उल्टी', 'Nausea'),
      l('back', 'Back / leg pain', 'कमर / पैर दर्द', 'Backache'),
      l('dizzy', 'Dizziness / fainting', 'चक्कर / बेहोशी', 'Dizziness', true),
      l('discharge', 'Foul-smelling white discharge', 'बदबूदार सफेद पानी', 'Foul discharge', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'mp_q4', key: 'history', type: 'single',
    question: q('Pain pattern?', 'दर्द का पैटर्न?'),
    options: [
      l('teen', 'Painful since teenage', 'किशोरावस्था से दर्द होता है', 'Since menarche'),
      l('new', 'Painless earlier, severe now', 'पहले ठीक था, अब तेज़ दर्द', 'New severe pattern', true),
      l('pcos', 'PCOS / thyroid / anemia known', 'PCOS / थायरॉइड / खून की कमी है', 'Known condition'),
    ],
  },
  {
    id: 'mp_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Pain severity (1–10)?', 'दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// NECK PAIN
export const neckPainFlow = [
  {
    id: 'np_q1', key: 'site', type: 'single',
    question: q('Where exactly is the neck pain?', 'गर्दन में दर्द कहाँ है?'),
    options: [
      l('back', 'Back of the neck', 'गर्दन के पीछे', 'Posterior neck'),
      l('oneside', 'One side of neck', 'एक ओर', 'Unilateral'),
      l('shoulder', 'Neck + shoulder', 'गर्दन + कंधा', 'Neck-shoulder'),
      l('headache', 'Neck + headache', 'गर्दन + सिरदर्द', 'With headache'),
    ],
  },
  {
    id: 'np_q2', key: 'radiation', type: 'single',
    question: q('Does the pain travel anywhere?', 'क्या दर्द कहीं जाता है?'),
    options: [
      l('stays', 'Stays in the neck', 'गर्दन में ही रहता है', 'Localized'),
      l('shoulder', 'Into shoulder / arm', 'कंधे / बांह में', 'Radiating to arm'),
      l('numb', 'Numbness / tingling in hand', 'हाथ में सुन्नपन / झनझनाहट', 'Numbness', true),
      l('weak', 'Weakness holding objects', 'चीज़ पकड़ने में कमज़ोरी', 'Weakness', true),
    ],
  },
  {
    id: 'np_q3', key: 'onset', type: 'single',
    question: q('How did it start?', 'शुरुआत कैसे हुई?'),
    options: [
      l('pillow', 'Wrong pillow / sleeping posture', 'गलत तकिया / सोने की मुद्रा', 'Postural'),
      l('mobile', 'Long mobile / computer use', 'लंबे समय मोबाइल / कंप्यूटर', 'Screen posture'),
      l('jerk', 'Sudden jerk or accident', 'अचानक झटका या दुर्घटना', 'Trauma', true),
      l('gradual', 'Gradually, no clear reason', 'धीरे-धीरे, बिना कारण', 'Gradual'),
    ],
  },
  {
    id: 'np_q4', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('stiff', 'Cannot turn neck', 'गर्दन घुमा नहीं पाते', 'Stiffness'),
      l('dizzy', 'Dizziness', 'चक्कर', 'Dizziness'),
      l('headache', 'Headache', 'सिरदर्द', 'Headache'),
      l('fever', 'Fever with neck stiffness', 'बुखार के साथ अकड़न', 'Fever with rigidity', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'np_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Neck pain severity (1–10)?', 'गर्दन दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// MUSCLE PAIN
export const musclePainFlow = [
  {
    id: 'msp_q1', key: 'site', type: 'single',
    question: q('Where is the muscle pain?', 'मांसपेशी दर्द कहाँ है?'),
    options: [
      l('one', 'One body part', 'शरीर के एक हिस्से में', 'Localized'),
      l('legs', 'Both legs', 'दोनों पैरों में', 'Both legs'),
      l('whole', 'Whole body', 'पूरे शरीर में', 'Generalized'),
      l('backlimb', 'Back + arms / legs', 'कमर + हाथ-पैर', 'Back with limbs'),
    ],
  },
  {
    id: 'msp_q2', key: 'onset', type: 'single',
    question: q('How did it start?', 'शुरुआत कैसे हुई?'),
    options: [
      l('exercise', 'After heavy work / exercise', 'भारी काम / व्यायाम के बाद', 'Exertional'),
      l('fever', 'With fever / flu', 'बुखार / फ्लू के साथ', 'Febrile illness'),
      l('noreason', 'Without any clear reason', 'बिना किसी कारण', 'Spontaneous'),
      l('medicine', 'After starting a new medicine', 'नई दवा शुरू करने के बाद', 'Drug-induced'),
    ],
  },
  {
    id: 'msp_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('weak', 'Weakness climbing stairs / rising', 'सीढ़ी / उठने में कमज़ोरी', 'Weakness'),
      l('cramps', 'Night cramps', 'रात में ऐंठन', 'Cramps'),
      l('darkurine', 'Dark brown urine', 'गहरा भूरा पेशाब', 'Dark urine', true),
      l('swelling', 'Muscle swelling', 'मांसपेशी में सूजन', 'Swelling', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'msp_q4', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('days', 'Few days', 'कुछ दिन', 'Days'),
      l('weeks', 'Few weeks', 'कुछ हफ्ते', 'Weeks'),
      l('months', 'Months', 'महीनों से', 'Chronic', true),
    ],
  },
  {
    id: 'msp_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Muscle pain severity (1–10)?', 'मांसपेशी दर्द कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Worst'], hi: ['हल्का','','','मध्यम','','','तेज़','','','असहनीय'] },
  },
]

// VERTIGO
export const vertigoFlow = [
  {
    id: 'vx_q1', key: 'character', type: 'single',
    question: q('How is the chakkar?', 'चक्कर कैसा लगता है?'),
    options: [
      l('spinning', 'Room spins around', 'कमरा घूमता है', 'Spinning'),
      l('unsteady', 'Unsteady while walking', 'चलने में लड़खड़ाहट', 'Unsteadiness'),
      l('blackout', 'Blackout on standing', 'खड़े होते ही अंधेरा', 'Presyncope'),
      l('light', 'Light-headed feeling', 'हल्का सिर', 'Lightheadedness'),
    ],
  },
  {
    id: 'vx_q2', key: 'trigger', type: 'single',
    question: q('When does it come?', 'कब आता है?'),
    options: [
      l('bed', 'Turning in bed / looking up', 'बिस्तर में करवट / ऊपर देखने पर', 'Positional'),
      l('stand', 'Standing up suddenly', 'अचानक खड़े होने पर', 'Orthostatic'),
      l('continuous', 'Continuous for hours', 'घंटों लगातार', 'Continuous'),
      l('injury', 'After loud noise / head injury', 'तेज़ आवाज़ / सिर की चोट के बाद', 'Post-trauma', true),
    ],
  },
  {
    id: 'vx_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('nausea', 'Nausea / vomiting', 'मतली / उल्टी', 'Nausea'),
      l('hearing', 'Hearing loss / ringing', 'सुनना कम / सीटी', 'Hearing change', true),
      l('neuro', 'Double vision / slurred speech', 'दोहरी दृष्टि / लड़खड़ाती बोली', 'Neuro signs', true),
      l('headache', 'Headache', 'सिरदर्द', 'Headache'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'vx_q4', key: 'duration', type: 'single',
    question: q('How long does each spell last?', 'हर दौर कितनी देर रहता है?'),
    options: [
      l('sec', 'Seconds', 'सेकंड', 'Seconds'),
      l('min', 'Minutes', 'मिनट', 'Minutes'),
      l('hours', 'Hours', 'घंटे', 'Hours'),
      l('days', 'Days together', 'दिनों तक', 'Days', true),
    ],
  },
  {
    id: 'vx_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How severe is the spinning (1–10)?', 'घूमना कितना तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Cannot stand'], hi: ['हल्का','','','मध्यम','','','तेज़','','','खड़ा नहीं हो सकते'] },
  },
]

// DEHYDRATION
export const dehydrationFlow = [
  {
    id: 'dh_q1', key: 'character', type: 'multi',
    question: q('What is happening?', 'क्या हो रहा है?'),
    options: [
      l('lessurine', 'Very less urination', 'बहुत कम पेशाब', 'Oliguria', true),
      l('dark', 'Dark yellow urine', 'गहरा पीला पेशाब', 'Dark urine'),
      l('thirst', 'Extreme thirst / dry mouth', 'बहुत प्यास / सूखा मुंह', 'Thirst'),
      l('losses', 'Loose motions / vomiting', 'दस्त / उल्टी', 'Fluid losses'),
      l('standdizzy', 'Dizziness on standing', 'खड़े होने पर चक्कर', 'Orthostatic dizziness', true),
    ],
  },
  {
    id: 'dh_q2', key: 'intake', type: 'single',
    question: q('How much fluid are you taking?', 'कितना पानी / तरल ले रहे हैं?'),
    options: [
      l('normal', 'Normal amount', 'सामान्य', 'Normal'),
      l('less', 'Less than usual', 'सामान्य से कम', 'Reduced'),
      l('almostnone', 'Almost nothing', 'लगभग कुछ नहीं', 'Minimal', true),
      l('cantkeep', 'Cannot keep fluids down', 'पानी भी नहीं रुकता', 'Cannot retain', true),
    ],
  },
  {
    id: 'dh_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('diarrhea', 'Diarrhea', 'दस्त', 'Diarrhea'),
      l('vomiting', 'Vomiting', 'उल्टी', 'Vomiting'),
      l('confusion', 'Confusion / extreme weakness', 'भ्रम / बहुत कमज़ोरी', 'Confusion', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'dh_q4', key: 'risk', type: 'single',
    question: q('Who is the patient?', 'रोगी कौन है?'),
    options: [
      l('adult', 'Adult', 'वयस्क', 'Adult'),
      l('elderchild', 'Elderly person / small child', 'बुजुर्ग / छोटा बच्चा', 'Vulnerable age', true),
      l('chronic', 'Diabetes / kidney / heart patient', 'डायबिटीज / किडनी / दिल के रोगी', 'Chronic disease', true),
    ],
  },
  {
    id: 'dh_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How weak do you feel (1–10)?', 'कितनी कमज़ोरी लग रही है? (1–10)'),
    labels: { en: ['Fine','','','Weak','','','Very weak','','','Collapse'], hi: ['ठीक','','','कमज़ोर','','','बहुत कमज़ोर','','','गिर रहे'] },
  },
]

// DIARRHEA
export const diarrheaFlow = [
  {
    id: 'dr_q1', key: 'character', type: 'single',
    question: q('How are the motions?', 'दस्त कैसे हैं?'),
    options: [
      l('watery', 'Watery, 3–5 times a day', 'पानी जैसे, दिन में 3-5 बार', 'Watery moderate'),
      l('freq', 'More than 8 times a day', 'दिन में 8 से ज़्यादा बार', 'Very frequent', true),
      l('mucus', 'With mucus', 'आंव / लेस के साथ', 'Mucus'),
      l('blood', 'With blood', 'खून के साथ', 'Bloody', true),
    ],
  },
  {
    id: 'dr_q2', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('day', 'Less than a day', 'एक दिन से कम', '<1 day'),
      l('d13', '1–3 days', '1-3 दिन', '1-3 days'),
      l('more3', 'More than 3 days', '3 दिन से ज़्यादा', '>3 days', true),
    ],
  },
  {
    id: 'dr_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('cramps', 'Stomach cramps', 'पेट में मरोड़', 'Cramps'),
      l('vomiting', 'Vomiting', 'उल्टी', 'Vomiting'),
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('nourine', 'No urine / very dry mouth', 'पेशाब बंद / बहुत सूखा मुंह', 'Dehydration signs', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'dr_q4', key: 'cause', type: 'single',
    question: q('What may have caused it?', 'कारण क्या हो सकता है?'),
    options: [
      l('outside', 'Outside / street food', 'बाहर का खाना', 'Outside food'),
      l('water', 'Unclean water', 'गंदा पानी', 'Water'),
      l('antibiotic', 'During antibiotic course', 'एंटीबायोटिक के दौरान', 'Antibiotic-associated'),
      l('vulnerable', 'Patient is a child / elderly', 'रोगी बच्चा / बुजुर्ग है', 'Vulnerable patient', true),
    ],
  },
  {
    id: 'dr_q5', key: 'count', type: 'single',
    question: q('How many motions in the last 24 hours?', 'पिछले 24 घंटे में कितनी बार दस्त?'),
    options: [
      l('lt5', 'Less than 5', '5 से कम', '<5'),
      l('f510', '5 to 10', '5 से 10', '5-10'),
      l('gt10', 'More than 10', '10 से ज़्यादा', '>10', true),
    ],
  },
]

// CONSTIPATION
export const constipationFlow = [
  {
    id: 'cs_q1', key: 'frequency', type: 'single',
    question: q('How often do you pass motion?', 'शौच कितनी बार होता है?'),
    options: [
      l('dailyhard', 'Daily but very hard', 'रोज़ पर बहुत कड़ा', 'Daily hard'),
      l('d23', 'Every 2–3 days', '2-3 दिन में', 'Every 2-3 days'),
      l('gap3', 'Gap of more than 3 days', '3 दिन से ज़्यादा अंतर', '>3 day gap', true),
    ],
  },
  {
    id: 'cs_q2', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('bloat', 'Stomach pain / bloating', 'पेट दर्द / फूलना', 'Bloating'),
      l('bleed', 'Bleeding with motion', 'शौच में खून', 'Bleeding', true),
      l('obstruct', 'Vomiting with no gas or stool passing', 'उल्टी, गैस-शौच बंद', 'Obstruction signs', true),
      l('weightloss', 'Thin pencil-like stool with weight loss', 'पतला शौच + वज़न घटना', 'Alarm signs', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'cs_q3', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('days', 'Few days', 'कुछ दिन', 'Days'),
      l('weeks', 'Few weeks', 'कुछ हफ्ते', 'Weeks'),
      l('months', 'Months / years', 'महीने / साल', 'Chronic'),
    ],
  },
  {
    id: 'cs_q4', key: 'cause', type: 'single',
    question: q('Possible reason?', 'संभावित कारण?'),
    options: [
      l('fibre', 'Low fibre / less water', 'कम फाइबर / कम पानी', 'Low fibre'),
      l('urge', 'Ignoring the urge (busy schedule)', 'हाजत रोकना', 'Ignoring urge'),
      l('medicine', 'New medicine (iron / painkiller)', 'नई दवा (आयरन / दर्द निवारक)', 'Drug-induced'),
      l('disease', 'Thyroid / diabetes', 'थायरॉइड / डायबिटीज', 'Systemic cause'),
    ],
  },
  {
    id: 'cs_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How uncomfortable is it (1–10)?', 'कितनी परेशानी है? (1–10)'),
    labels: { en: ['Little','','','Some','','','Lot','','','Severe'], hi: ['थोड़ी','','','कुछ','','','ज़्यादा','','','बहुत'] },
  },
]

// VOMITING
export const vomitingFlow = [
  {
    id: 'vo_q1', key: 'character', type: 'single',
    question: q('How is the vomiting?', 'उल्टी कैसी है?'),
    options: [
      l('once', '1–2 times only', 'सिर्फ 1-2 बार', '1-2 episodes'),
      l('repeat', 'Repeatedly, but keeping some fluids', 'बार-बार, पर कुछ पानी रुकता है', 'Repeated'),
      l('cantkeep', 'Cannot keep even water down', 'पानी भी नहीं रुकता', 'Cannot retain fluids', true),
      l('blood', 'Blood in vomit / black like coffee', 'खून / कॉफी जैसा काला', 'Hematemesis', true),
    ],
  },
  {
    id: 'vo_q2', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('stomach', 'Stomach pain', 'पेट दर्द', 'Abdominal pain'),
      l('loose', 'Loose motions', 'दस्त', 'Diarrhea'),
      l('fever', 'Fever', 'बुखार', 'Fever'),
      l('headneck', 'Severe headache with neck stiffness', 'तेज़ सिरदर्द + गर्दन अकड़न', 'Meningism', true),
      l('chest', 'Chest pain / sweating', 'सीने में दर्द / पसीना', 'Cardiac-type', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'vo_q3', key: 'trigger', type: 'single',
    question: q('What seems to trigger it?', 'कारण क्या लगता है?'),
    options: [
      l('food', 'Outside / stale food', 'बाहर का / बासी खाना', 'Food'),
      l('over', 'Overeating / alcohol', 'ज़्यादा खाना / शराब', 'Overindulgence'),
      l('medicine', 'New medicine started', 'नई दवा शुरू की', 'Drug-induced'),
      l('preg', 'Missed periods — pregnancy possible', 'मासिक रुका — गर्भ संभव', 'Possible pregnancy'),
    ],
  },
  {
    id: 'vo_q4', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('hours', 'Few hours', 'कुछ घंटे', 'Hours'),
      l('d12', '1–2 days', '1-2 दिन', '1-2 days'),
      l('more2', 'More than 2 days', '2 दिन से ज़्यादा', '>2 days', true),
    ],
  },
  {
    id: 'vo_q5', key: 'count', type: 'single',
    question: q('How many times vomited in 24 hours?', '24 घंटे में कितनी बार उल्टी?'),
    options: [
      l('lt3', 'Less than 3', '3 से कम', '<3'),
      l('f36', '3 to 6', '3 से 6', '3-6'),
      l('gt6', 'More than 6', '6 से ज़्यादा', '>6', true),
    ],
  },
]

// COMMON COLD
export const coldFlow = [
  {
    id: 'cc_q1', key: 'character', type: 'multi',
    question: q('What troubles you most?', 'सबसे ज़्यादा क्या तकलीफ है?'),
    options: [
      l('runny', 'Runny nose', 'बहती नाक', 'Rhinorrhea'),
      l('blocked', 'Blocked nose', 'बंद नाक', 'Congestion'),
      l('sneeze', 'Continuous sneezing', 'लगातार छींकें', 'Sneezing'),
      l('scratch', 'Throat scratch', 'गले में खराश', 'Throat irritation'),
      l('fever', 'Mild fever / body ache', 'हल्का बुखार / बदन दर्द', 'Low-grade fever'),
    ],
  },
  {
    id: 'cc_q2', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('d13', '1–3 days', '1-3 दिन', 'Acute'),
      l('d47', '4–7 days', '4-7 दिन', 'Subacute'),
      l('more10', 'More than 10 days', '10 दिन से ज़्यादा', 'Prolonged', true),
    ],
  },
  {
    id: 'cc_q3', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('sinus', 'Thick yellow-green mucus with face pain', 'पीला-हरा गाढ़ा बलगम + चेहरे में दर्द', 'Sinusitis signs', true),
      l('ear', 'Ear blockage / pain', 'कान बंद / दर्द', 'Ear involvement'),
      l('wheeze', 'Cough with wheezing', 'घरघराहट वाली खांसी', 'Wheeze', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'cc_q4', key: 'risk', type: 'multi',
    question: q('Which apply to you?', 'इनमें से क्या लागू होता है?'),
    options: [
      l('asthma', 'Asthma / allergy history', 'दमा / एलर्जी का इतिहास', 'Atopy'),
      l('chronic', 'BP / diabetes / heart patient', 'BP / शुगर / दिल के रोगी', 'Chronic disease', true),
      l('smoker', 'Smoker', 'धूम्रपान', 'Smoking'),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'cc_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How sick do you feel (1–10)?', 'कितनी तकलीफ लग रही है? (1–10)'),
    labels: { en: ['Little','','','Some','','','Lot','','','Severe'], hi: ['थोड़ी','','','कुछ','','','ज़्यादा','','','बहुत'] },
  },
]

// FLU
export const fluFlow = [
  {
    id: 'fl_q1', key: 'onset', type: 'single',
    question: q('How did the illness begin?', 'बीमारी कैसे शुरू हुई?'),
    options: [
      l('sudden', 'Sudden high fever with chills', 'अचानक तेज़ बुखार + ठंड', 'Abrupt febrile'),
      l('cold', 'Cold first, then fever', 'पहले सर्दी, फिर बुखार', 'Coryzal onset'),
      l('ache', 'Fever with breaking body ache', 'बुखार + टूटता बदन दर्द', 'Myalgic onset'),
      l('cough', 'Fever with dry cough', 'बुखार + सूखी खांसी', 'Respiratory onset'),
    ],
  },
  {
    id: 'fl_q2', key: 'associated', type: 'multi',
    question: q('Do you also have?', 'क्या साथ में यह भी है?'),
    options: [
      l('bodyache', 'Severe body ache', 'तेज़ बदन दर्द', 'Myalgia'),
      l('drycough', 'Dry cough', 'सूखी खांसी', 'Dry cough'),
      l('sorethroat', 'Sore throat', 'गले में खराश', 'Sore throat'),
      l('breath', 'Breathlessness', 'सांस फूलना', 'Dyspnea', true),
      l('confusion', 'Confusion / drowsiness', 'भ्रम / सुस्ती', 'Confusion', true),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'fl_q3', key: 'temperature', type: 'single',
    question: q('How high is the fever?', 'बुखार कितना है?'),
    options: [
      l('low', 'Below 100°F', '100°F से कम', 'Low grade'),
      l('mid', '100–102°F', '100-102°F', 'Moderate'),
      l('high', '102–104°F', '102-104°F', 'High grade'),
      l('vhigh', 'Above 104°F', '104°F से ऊपर', 'Very high', true),
    ],
  },
  {
    id: 'fl_q4', key: 'risk', type: 'multi',
    question: q('Are you in a high-risk group?', 'क्या आप ज़्यादा जोखिम वाले समूह में हैं?'),
    options: [
      l('elderchild', 'Elderly / small child', 'बुजुर्ग / छोटा बच्चा', 'Vulnerable age', true),
      l('preg', 'Pregnant', 'गर्भवती', 'Pregnancy', true),
      l('chronic', 'Asthma / diabetes / heart disease', 'दमा / शुगर / दिल की बीमारी', 'Chronic disease', true),
      l('none', 'None of the above', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'fl_q5', key: 'duration', type: 'single',
    question: q('Fever since?', 'बुखार कब से है?'),
    options: [
      l('d12', '1–2 days', '1-2 दिन', '1-2 days'),
      l('d35', '3–5 days', '3-5 दिन', '3-5 days'),
      l('more5', 'More than 5 days', '5 दिन से ज़्यादा', '>5 days', true),
    ],
  },
]

// ACNE
export const acneFlow = [
  {
    id: 'ac_q1', key: 'character', type: 'single',
    question: q('What do you see on the skin?', 'त्वचा पर क्या दिखता है?'),
    options: [
      l('comedones', 'Blackheads / whiteheads', 'ब्लैकहेड्स / व्हाइटहेड्स', 'Comedonal'),
      l('red', 'Red painful pimples', 'लाल दर्द वाले दाने', 'Papular'),
      l('pus', 'Pus-filled boils', 'मवाद वाले फोड़े', 'Pustular'),
      l('lumps', 'Deep painful lumps with scars', 'गहरी गांठें + दाग', 'Nodular with scarring', true),
    ],
  },
  {
    id: 'ac_q2', key: 'extent', type: 'single',
    question: q('How widespread is it?', 'कितना फैला है?'),
    options: [
      l('face', 'Face only', 'सिर्फ चेहरा', 'Face only'),
      l('faceback', 'Face + back / chest', 'चेहरा + पीठ / छाती', 'Face and trunk'),
      l('hormonal', 'With hair fall / dandruff / irregular periods', 'बाल झड़ना / रूसी / अनियमित मासिक के साथ', 'Hormonal pattern', true),
    ],
  },
  {
    id: 'ac_q3', key: 'habit', type: 'multi',
    question: q('Which habits apply?', 'कौन सी आदतें हैं?'),
    options: [
      l('squeeze', 'Squeezing / picking pimples', 'मुंहासे फोड़ना / नोचना', 'Picking'),
      l('cosmetic', 'Oily cosmetics / creams', 'तैलीय क्रीम / मेकअप', 'Comedogenic cosmetics'),
      l('supplement', 'Protein / steroid supplements', 'प्रोटीन / स्टेरॉयड सप्लीमेंट', 'Supplements'),
      l('none', 'None of these', 'इनमें से कुछ नहीं', 'None', false, true),
    ],
  },
  {
    id: 'ac_q4', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('weeks', 'Few weeks', 'कुछ हफ्ते', 'Weeks'),
      l('months', 'Few months', 'कुछ महीने', 'Months'),
      l('years', 'Years', 'सालों से', 'Years'),
    ],
  },
  {
    id: 'ac_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('How much does it bother you (1–10)?', 'कितनी परेशानी है? (1–10)'),
    labels: { en: ['Little','','','Some','','','Lot','','','Severe'], hi: ['थोड़ी','','','कुछ','','','ज़्यादा','','','बहुत'] },
  },
]

// FUNGAL INFECTION
export const fungalFlow = [
  {
    id: 'fu_q1', key: 'site', type: 'single',
    question: q('Where is the patch?', 'दाना / चकत्ता कहाँ है?'),
    options: [
      l('groin', 'Groin / inner thigh', 'जांघ / कच्छा', 'Groin'),
      l('feet', 'Feet / between toes', 'पैर / उंगलियों के बीच', 'Feet'),
      l('body', 'Body in round rings', 'शरीर पर गोल चकत्ते', 'Body rings'),
      l('scalp', 'Scalp with hair loss', 'सिर में बाल झड़ने के साथ', 'Scalp', true),
    ],
  },
  {
    id: 'fu_q2', key: 'character', type: 'single',
    question: q('How does it look and feel?', 'कैसा दिखता / लगता है?'),
    options: [
      l('rings', 'Round itchy rings spreading outward', 'गोल खुजली वाले चकत्ते फैल रहे', 'Spreading rings'),
      l('scaling', 'White powdery scaling', 'सफेद पपड़ी', 'Scaling'),
      l('pus', 'Boils with pus', 'मवाद वाले फोड़े', 'Pustular', true),
      l('dark', 'Dark thick patch, not improving for months', 'काला मोटा दाना, महीनों से ठीक नहीं', 'Chronic resistant', true),
    ],
  },
  {
    id: 'fu_q3', key: 'habit', type: 'multi',
    question: q('Which apply to you?', 'इनमें से क्या लागू होता है?'),
    options: [
      l('towel', 'Sharing towel / clothes', 'तौलिया / कपड़े साझा करना', 'Sharing'),
      l('sweat', 'Sweating all day', 'दिनभर पसीना', 'Sweating'),
      l('steroid', 'Using steroid cream (Betnovate etc.)', 'स्टेरॉयड क्रीम लगाना', 'Steroid misuse', true),
      l('diabetes', 'Diabetes', 'डायबिटीज', 'Diabetes'),
      l('none', 'None of these', 'इनमें से कोई नहीं', 'None', false, true),
    ],
  },
  {
    id: 'fu_q4', key: 'duration', type: 'single',
    question: q('Since when?', 'कब से है?'),
    options: [
      l('days', 'Few days', 'कुछ दिन', 'Days'),
      l('weeks', 'Few weeks', 'कुछ हफ्ते', 'Weeks'),
      l('months', 'Months', 'महीनों से', 'Chronic', true),
    ],
  },
  {
    id: 'fu_q5', key: 'severity', type: 'scale', min: 1, max: 10,
    question: q('Itching severity (1–10)?', 'खुजली कितनी तेज़ है? (1–10)'),
    labels: { en: ['Mild','','','Moderate','','','Severe','','','Unbearable'], hi: ['हल्की','','','मध्यम','','','तेज़','','','असहनीय'] },
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
  // ── Extended conditions: each has its OWN tailored interview ──
  palpitations:   palpitationsFlow,
  hypertension:   hypertensionFlow,
  asthma:         breathingFlow,
  common_cold:    coldFlow,
  vertigo:        vertigoFlow,
  seizure:        seizureFlow,
  neck_pain:      neckPainFlow,
  muscle_pain:    musclePainFlow,
  flu:            fluFlow,
  dehydration:    dehydrationFlow,
  diarrhea:       diarrheaFlow,
  constipation:   constipationFlow,
  vomiting:       vomitingFlow,
  acne:           acneFlow,
  fungal_infection: fungalFlow,
  red_eye:        eyeFlow,
  vision_problems: eyeFlow,
  ear_pain:       earPainFlow,
  sore_throat:    soreThroatFlow,
  thyroid:        thyroidFlow,
  obesity:        obesityFlow,
  kidney_stone:   kidneyStoneFlow,
  menstrual_pain: menstrualFlow,
  pregnancy_care: genericFlow,
  toothache:      genericFlow,
  gum_problems:   genericFlow,
}

// ─────────────────────────────────────────────
// Categories for the Symptom Picker UI
// ─────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'general',  en: 'General',              hi: 'सामान्य' },
  { id: 'cardiac',  en: 'Cardiac',              hi: 'हृदय रोग' },
  { id: 'respiratory', en: 'Respiratory',       hi: 'श्वसन रोग' },
  { id: 'gastro',   en: 'Gastrointestinal',     hi: 'पेट व पाचन' },
  { id: 'neuro',    en: 'Neurological',         hi: 'मस्तिष्क व नसें' },
  { id: 'musculo',  en: 'Bone & Muscle',        hi: 'हड्डी व मांसपेशी' },
  { id: 'metabolic', en: 'Metabolic',           hi: 'चयापचय' },
  { id: 'derm',     en: 'Skin',                 hi: 'त्वचा' },
  { id: 'eye',      en: 'Eye',                  hi: 'आंख' },
  { id: 'ent',      en: 'Ear, Nose & Throat',   hi: 'कान-नाक-गला' },
  { id: 'uro',      en: 'Urinary & Kidney',     hi: 'पेशाब व गुर्दा' },
  { id: 'women',    en: "Women's Health",       hi: 'महिला स्वास्थ्य' },
  { id: 'oral',     en: 'Oral Health',          hi: 'दांत व मुंह' },
  { id: 'mental',   en: 'Mental Health',        hi: 'मानसिक स्वास्थ्य' },
]

// ─────────────────────────────────────────────
// Condition metadata for the Symptom Picker UI
// ─────────────────────────────────────────────
export const CONDITIONS = [
  { id: 'chest_pain',     en: 'Chest Pain',          hi: 'सीने में दर्द',       emoji: '🫀', color: 'red',    cat: 'cardiac' },
  { id: 'headache',       en: 'Headache',             hi: 'सिरदर्द',             emoji: '🧠', color: 'purple', cat: 'neuro' },
  { id: 'fever',          en: 'Fever',                hi: 'बुखार',               emoji: '🌡️', color: 'orange', cat: 'general' },
  { id: 'abdominal_pain', en: 'Abdominal Pain',       hi: 'पेट दर्द',            emoji: '🫁', color: 'yellow', cat: 'gastro' },
  { id: 'breathing',      en: 'Breathing Difficulty', hi: 'सांस की तकलीफ',       emoji: '💨', color: 'blue',   cat: 'respiratory' },
  { id: 'joint_pain',     en: 'Joint / Bone Pain',    hi: 'जोड़ों / हड्डियों में दर्द', emoji: '🦴', color: 'indigo', cat: 'musculo' },
  { id: 'back_pain',      en: 'Back Pain',            hi: 'पीठ / कमर दर्द',      emoji: '🔩', color: 'slate',  cat: 'musculo' },
  { id: 'diabetes',       en: 'Diabetes Symptoms',    hi: 'डायबिटीज़ के लक्षण',  emoji: '🩸', color: 'pink',   cat: 'metabolic' },
  { id: 'dizziness',      en: 'Dizziness',            hi: 'चक्कर आना',           emoji: '💫', color: 'teal',   cat: 'neuro' },
  { id: 'cough',          en: 'Cough',                hi: 'खांसी',               emoji: '🤧', color: 'green',  cat: 'respiratory' },
  { id: 'skin_rash',      en: 'Skin Rash',            hi: 'त्वचा के दाने',        emoji: '🌸', color: 'rose',   cat: 'derm' },
  { id: 'eye_problems',   en: 'Eye Problems',         hi: 'आँखों की समस्या',     emoji: '👁️', color: 'cyan',   cat: 'eye' },
  { id: 'urinary',        en: 'Urinary Problems',     hi: 'पेशाब की समस्या',     emoji: '💧', color: 'sky',    cat: 'uro' },
  { id: 'mental_health',  en: 'Anxiety / Mental Health', hi: 'चिंता / मानसिक स्वास्थ्य', emoji: '🧘', color: 'violet', cat: 'mental' },
  { id: 'fatigue',        en: 'Weakness / Fatigue',   hi: 'कमज़ोरी / थकान',      emoji: '⚡', color: 'amber',  cat: 'general' },
  // ── Cardiac ──
  { id: 'palpitations',   en: 'Palpitations',         hi: 'दिल तेज़ धड़कना',     emoji: '💓', color: 'red',    cat: 'cardiac' },
  { id: 'hypertension',   en: 'High Blood Pressure',  hi: 'हाई ब्लड प्रेशर',     emoji: '🩺', color: 'red',    cat: 'cardiac' },
  // ── Respiratory ──
  { id: 'asthma',         en: 'Asthma',               hi: 'दमा',                 emoji: '🌬️', color: 'blue',   cat: 'respiratory' },
  { id: 'common_cold',    en: 'Common Cold',          hi: 'सर्दी-जुकाम',         emoji: '🤧', color: 'green',  cat: 'respiratory' },
  // ── Neurological ──
  { id: 'vertigo',        en: 'Vertigo',              hi: 'घूमता चक्कर',         emoji: '🌀', color: 'teal',   cat: 'neuro' },
  { id: 'seizure',        en: 'Seizure Symptoms',     hi: 'दौरे के लक्षण',       emoji: '⚠️', color: 'purple', cat: 'neuro' },
  // ── Bone & Muscle ──
  { id: 'neck_pain',      en: 'Neck Pain',            hi: 'गर्दन दर्द',          emoji: '🧍', color: 'indigo', cat: 'musculo' },
  { id: 'muscle_pain',    en: 'Muscle Pain',          hi: 'मांसपेशी दर्द',       emoji: '💪', color: 'slate',  cat: 'musculo' },
  // ── General ──
  { id: 'flu',            en: 'Flu',                  hi: 'फ्लू',                emoji: '🤒', color: 'orange', cat: 'general' },
  { id: 'dehydration',    en: 'Dehydration',          hi: 'पानी की कमी',         emoji: '🥤', color: 'amber',  cat: 'general' },
  // ── Gastrointestinal ──
  { id: 'diarrhea',       en: 'Diarrhea',             hi: 'दस्त',                emoji: '🚻', color: 'yellow', cat: 'gastro' },
  { id: 'constipation',   en: 'Constipation',         hi: 'कब्ज',                emoji: '🚽', color: 'amber',  cat: 'gastro' },
  { id: 'vomiting',       en: 'Vomiting',             hi: 'उल्टी',               emoji: '🤮', color: 'orange', cat: 'gastro' },
  // ── Skin ──
  { id: 'acne',           en: 'Acne / Pimples',       hi: 'मुंहासे',              emoji: '🫧', color: 'rose',   cat: 'derm' },
  { id: 'fungal_infection', en: 'Fungal Infection',   hi: 'फंगल संक्रमण',       emoji: '🍄', color: 'green',  cat: 'derm' },
  // ── Eye ──
  { id: 'red_eye',        en: 'Red Eye',              hi: 'आंखों की लाली',       emoji: '🔴', color: 'cyan',   cat: 'eye' },
  { id: 'vision_problems', en: 'Vision Problems',     hi: 'धुंधला दिखना',        emoji: '👓', color: 'cyan',   cat: 'eye' },
  // ── ENT ──
  { id: 'ear_pain',       en: 'Ear Pain',             hi: 'कान दर्द',            emoji: '👂', color: 'sky',    cat: 'ent' },
  { id: 'sore_throat',    en: 'Sore Throat',          hi: 'गले में खराश',        emoji: '🗣️', color: 'sky',    cat: 'ent' },
  // ── Metabolic ──
  { id: 'thyroid',        en: 'Thyroid Symptoms',     hi: 'थायरॉइड के लक्षण',    emoji: '🦋', color: 'pink',   cat: 'metabolic' },
  { id: 'obesity',        en: 'Obesity / Weight Gain', hi: 'मोटापा / वजन बढ़ना', emoji: '⚖️', color: 'pink',   cat: 'metabolic' },
  // ── Urinary & Kidney ──
  { id: 'kidney_stone',   en: 'Kidney Stone Symptoms', hi: 'पथरी के लक्षण',      emoji: '🪨', color: 'sky',    cat: 'uro' },
  // ── Women's Health ──
  { id: 'menstrual_pain', en: 'Menstrual Pain',       hi: 'मासिक धर्म दर्द',     emoji: '🌺', color: 'pink',   cat: 'women' },
  { id: 'pregnancy_care', en: 'Pregnancy Care',       hi: 'गर्भावस्था देखभाल',   emoji: '🤰', color: 'pink',   cat: 'women' },
  // ── Oral Health ──
  { id: 'toothache',      en: 'Toothache',            hi: 'दांत दर्द',            emoji: '🦷', color: 'slate',  cat: 'oral' },
  { id: 'gum_problems',   en: 'Gum Problems',         hi: 'मसूड़ों की समस्या',   emoji: '👄', color: 'slate',  cat: 'oral' },
]
