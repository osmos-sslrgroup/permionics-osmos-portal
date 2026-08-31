import { Question, Section, SectorState } from '../types/questionnaire';

function createId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// ---------------------------------------------------------------------------
// PHARMA & HERBAL
// ---------------------------------------------------------------------------
const PHARMA_SECTIONS: Section[] = [
  { id: 'ph_s1', title: 'SECTION 1: Company & Contact Details', isExpanded: true },
  { id: 'ph_s2', title: 'SECTION 2: Your Process & Application', isExpanded: true },
  { id: 'ph_s3', title: 'SECTION 3: Feed Stream Characteristics', isExpanded: true },
  { id: 'ph_s4', title: 'SECTION 4: Treatment Requirements & Output Targets', isExpanded: true },
  { id: 'ph_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const PHARMA_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'ph_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'ph_s1' },
  { id: createId(), number: 3, text: 'Type of pharmaceutical or herbal product you manufacture (APIs / formulations / herbal extracts / nutraceuticals / other — please specify)', type: 'Text', required: true, sectionId: 'ph_s1' },

  { id: createId(), number: 4, text: 'Which specific process stream requires treatment? (process water / API or extract recovery / mother liquor / CIP/wash water / effluent / other)', type: 'Text', required: true, sectionId: 'ph_s2' },
  { id: createId(), number: 5, text: 'What is your primary objective for this project? (Effluent treatment & ZLD / Process water purification for reuse / Product or API recovery / Regulatory compliance / Cost reduction / Other)', type: 'Choice', required: true, sectionId: 'ph_s2' },
  { id: createId(), number: 6, text: 'Briefly describe your current method of handling this stream (discharge to ETP / partial treatment / no treatment / sold as by-product)', type: 'Text', required: false, sectionId: 'ph_s2' },
  { id: createId(), number: 7, text: 'Do you have an existing treatment system in place? If yes, please describe the type and capacity', type: 'Text', required: false, sectionId: 'ph_s2' },

  { id: createId(), number: 8, text: 'What is the total volume of this stream generated per day? (KLD or m³/day)', type: 'Number', required: true, sectionId: 'ph_s3' },
  { id: createId(), number: 9, text: 'What are the known parameters of your feed stream? (pH, TDS ppm, COD ppm, BOD ppm, TSS/turbidity, conductivity, specific API or compound — attach lab report if available)', type: 'Table', required: true, sectionId: 'ph_s3' },
  { id: createId(), number: 10, text: 'Are there any solvents, chemicals, or compounds in the stream that could affect membrane compatibility? (list if known)', type: 'Text', required: false, sectionId: 'ph_s3' },
  { id: createId(), number: 11, text: 'What is the typical operating temperature of the stream? (°C)', type: 'Number', required: false, sectionId: 'ph_s3' },

  { id: createId(), number: 12, text: 'What output water quality do you need to achieve? (for reuse in process / boiler feed / discharge — specify target TDS, COD, or other parameters)', type: 'Text', required: true, sectionId: 'ph_s4' },
  { id: createId(), number: 13, text: 'If product or API recovery is the goal, what purity or concentration level do you require in the retentate/permeate?', type: 'Text', required: false, sectionId: 'ph_s4' },
  { id: createId(), number: 14, text: 'What regulatory discharge standard must be met? (CPCB / State PCB / in-house norms — please specify limits)', type: 'Text', required: true, sectionId: 'ph_s4' },
  { id: createId(), number: 15, text: 'Do you require Zero Liquid Discharge (ZLD)? If yes, is there a regulatory deadline?', type: 'Choice', required: true, sectionId: 'ph_s4' },

  { id: createId(), number: 16, text: 'What is your target timeline for commissioning the system?', type: 'Text', required: true, sectionId: 'ph_s5' },
  { id: createId(), number: 17, text: 'Available power supply at site (kVA) and approximate space available for installation (m²)', type: 'Text', required: false, sectionId: 'ph_s5' },
  { id: createId(), number: 18, text: 'Any other requirements, constraints, or information you would like to share with us?', type: 'Text', required: false, sectionId: 'ph_s5' },
];

// ---------------------------------------------------------------------------
// DAIRY
// ---------------------------------------------------------------------------
const DAIRY_SECTIONS: Section[] = [
  { id: 'dy_s1', title: 'SECTION 1: Company & Contact Details', isExpanded: true },
  { id: 'dy_s2', title: 'SECTION 2: Your Process & Application', isExpanded: true },
  { id: 'dy_s3', title: 'SECTION 3: Feed Stream Characteristics', isExpanded: true },
  { id: 'dy_s4', title: 'SECTION 4: Treatment Requirements & Output Targets', isExpanded: true },
  { id: 'dy_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const DAIRY_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'dy_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'dy_s1' },
  { id: createId(), number: 3, text: 'What dairy products do you manufacture? (cheese / whey protein / milk powder / UHT milk / butter / ghee / other — please specify)', type: 'Text', required: true, sectionId: 'dy_s1' },

  { id: createId(), number: 4, text: 'Which stream needs treatment? (whey / CIP/wash effluent / process water / combined dairy effluent / other — specify)', type: 'Text', required: true, sectionId: 'dy_s2' },
  { id: createId(), number: 5, text: 'What is your primary objective? (Whey protein or lactose recovery / Milk or product concentration / Effluent treatment & ZLD / Process water reuse / Regulatory compliance / Other)', type: 'Choice', required: true, sectionId: 'dy_s2' },
  { id: createId(), number: 6, text: 'Describe your current handling of this stream (discharge to ETP / partial treatment / by-product sale / no treatment)', type: 'Text', required: false, sectionId: 'dy_s2' },
  { id: createId(), number: 7, text: 'Do you have an existing treatment or concentration system? If yes, describe briefly', type: 'Text', required: false, sectionId: 'dy_s2' },

  { id: createId(), number: 8, text: 'Volume of stream generated per day (KLD or m³/day)', type: 'Number', required: true, sectionId: 'dy_s3' },
  { id: createId(), number: 9, text: 'Known parameters of your feed stream (total solids %, protein %, lactose %, fat content %, COD ppm, pH, conductivity — attach lab data if available)', type: 'Table', required: true, sectionId: 'dy_s3' },
  { id: createId(), number: 10, text: 'Typical operating temperature of the stream (°C)', type: 'Number', required: false, sectionId: 'dy_s3' },
  { id: createId(), number: 11, text: 'What cleaning agents are used in your CIP process? (NaOH concentration, acid type — relevant for membrane compatibility)', type: 'Text', required: false, sectionId: 'dy_s3' },

  { id: createId(), number: 12, text: 'What output quality or concentration level do you need to achieve? (for product reuse / discharge — specify target values)', type: 'Text', required: true, sectionId: 'dy_s4' },
  { id: createId(), number: 13, text: 'If protein or whey recovery is the goal, what purity and concentration target do you require?', type: 'Text', required: false, sectionId: 'dy_s4' },
  { id: createId(), number: 14, text: 'What regulatory discharge standard must your effluent meet? (CPCB / State PCB — specify parameter limits)', type: 'Text', required: true, sectionId: 'dy_s4' },
  { id: createId(), number: 15, text: 'Do you require Zero Liquid Discharge (ZLD)? If yes, is there a regulatory deadline?', type: 'Choice', required: true, sectionId: 'dy_s4' },

  { id: createId(), number: 16, text: 'Target timeline for system commissioning', type: 'Text', required: true, sectionId: 'dy_s5' },
  { id: createId(), number: 17, text: 'Available power supply (kVA) and installation space at site (m²)', type: 'Text', required: false, sectionId: 'dy_s5' },
  { id: createId(), number: 18, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'dy_s5' },
];

// ---------------------------------------------------------------------------
// WATER & WASTEWATER
// ---------------------------------------------------------------------------
const WATER_SECTIONS: Section[] = [
  { id: 'wt_s1', title: 'SECTION 1: Organisation & Contact Details', isExpanded: true },
  { id: 'wt_s2', title: 'SECTION 2: Water Source & Current Situation', isExpanded: true },
  { id: 'wt_s3', title: 'SECTION 3: Feed Water Characteristics', isExpanded: true },
  { id: 'wt_s4', title: 'SECTION 4: Treatment Requirements & Output Targets', isExpanded: true },
  { id: 'wt_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const WATER_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Organisation / company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'wt_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'wt_s1' },
  { id: createId(), number: 3, text: 'Type of application (Municipal drinking water / Industrial process water / Effluent treatment / ZLD plant / Boiler or cooling water / Other)', type: 'Text', required: true, sectionId: 'wt_s1' },

  { id: createId(), number: 4, text: 'What is your water source or the stream requiring treatment? (borewell / river / surface water / municipal supply / recycled effluent / industrial discharge)', type: 'Text', required: true, sectionId: 'wt_s2' },
  { id: createId(), number: 5, text: 'What is the intended use of the treated water? (drinking / process reuse / boiler feed / cooling towers / ZLD / discharge to environment — specify)', type: 'Text', required: true, sectionId: 'wt_s2' },
  { id: createId(), number: 6, text: 'Do you have an existing treatment system? If yes, describe type, capacity, and what stage it treats up to', type: 'Text', required: false, sectionId: 'wt_s2' },
  { id: createId(), number: 7, text: 'What is the total volume requiring treatment per day? (m³/day or KLD)', type: 'Number', required: true, sectionId: 'wt_s2' },

  { id: createId(), number: 8, text: 'Known parameters of your feed water (pH, TDS ppm, hardness ppm, turbidity NTU, iron ppm, fluoride ppm, nitrates ppm, COD ppm, BOD ppm, conductivity µS/cm — attach lab report if available)', type: 'Table', required: true, sectionId: 'wt_s3' },
  { id: createId(), number: 9, text: 'Are there any specific contaminants of concern? (heavy metals, specific salts, biological load, colour — list with approximate levels)', type: 'Text', required: false, sectionId: 'wt_s3' },
  { id: createId(), number: 10, text: 'Is there seasonal variation in feed water quality? If yes, please describe', type: 'Text', required: false, sectionId: 'wt_s3' },

  { id: createId(), number: 11, text: 'What output water quality do you need? (target TDS ppm, hardness, specific parameters — specify clearly)', type: 'Text', required: true, sectionId: 'wt_s4' },
  { id: createId(), number: 12, text: 'What regulatory or quality standard must be met? (IS 10500 / CPCB / State PCB / internal specs — specify parameter limits)', type: 'Text', required: true, sectionId: 'wt_s4' },
  { id: createId(), number: 13, text: 'Do you require Zero Liquid Discharge (ZLD)? If yes, is there a regulatory deadline and what is the current discharge volume?', type: 'Choice', required: true, sectionId: 'wt_s4' },
  { id: createId(), number: 14, text: 'What permeate recovery percentage are you targeting? (e.g. 75%, 90% — or leave blank if unsure)', type: 'Number', required: false, sectionId: 'wt_s4' },

  { id: createId(), number: 15, text: 'Target timeline for system commissioning', type: 'Text', required: true, sectionId: 'wt_s5' },
  { id: createId(), number: 16, text: 'Available power supply (kVA) and space for installation (m²)', type: 'Text', required: false, sectionId: 'wt_s5' },
  { id: createId(), number: 17, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'wt_s5' },
];

// ---------------------------------------------------------------------------
// FOOD & BEVERAGE
// ---------------------------------------------------------------------------
const FOOD_SECTIONS: Section[] = [
  { id: 'fd_s1', title: 'SECTION 1: Company & Contact Details', isExpanded: true },
  { id: 'fd_s2', title: 'SECTION 2: Your Process & Application', isExpanded: true },
  { id: 'fd_s3', title: 'SECTION 3: Feed Stream Characteristics', isExpanded: true },
  { id: 'fd_s4', title: 'SECTION 4: Treatment Requirements & Output Targets', isExpanded: true },
  { id: 'fd_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const FOOD_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'fd_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'fd_s1' },
  { id: createId(), number: 3, text: 'What food or beverage product(s) do you process? (juices / beverages / edible oils / sauces / brewing / dairy derivatives / other — specify)', type: 'Text', required: true, sectionId: 'fd_s1' },

  { id: createId(), number: 4, text: 'Which stream or application requires membrane treatment? (product concentration / juice/beverage clarification / sterilisation / process water / effluent treatment — specify)', type: 'Text', required: true, sectionId: 'fd_s2' },
  { id: createId(), number: 5, text: 'What is your primary objective? (Improve product quality / Increase yield / Clarify or sterilise product / Effluent treatment & ZLD / Process water reuse / Reduce operating costs / Other)', type: 'Choice', required: true, sectionId: 'fd_s2' },
  { id: createId(), number: 6, text: 'Describe your current handling of this stream', type: 'Text', required: false, sectionId: 'fd_s2' },
  { id: createId(), number: 7, text: 'Do you have an existing treatment or concentration system? If yes, describe briefly', type: 'Text', required: false, sectionId: 'fd_s2' },

  { id: createId(), number: 8, text: 'Volume of stream to be processed per day or per batch (m³/day or kg/batch)', type: 'Text', required: true, sectionId: 'fd_s3' },
  { id: createId(), number: 9, text: 'Known parameters of your feed stream (°Brix, pH, turbidity NTU, TSS %, protein %, sugar content %, conductivity — attach lab data if available)', type: 'Table', required: true, sectionId: 'fd_s3' },
  { id: createId(), number: 10, text: 'Operating temperature of the stream (°C)', type: 'Number', required: false, sectionId: 'fd_s3' },
  { id: createId(), number: 11, text: 'What food safety or hygiene standards must the membrane system comply with? (FDA / FSSAI / EU food-contact / other — specify)', type: 'Text', required: false, sectionId: 'fd_s3' },
  { id: createId(), number: 12, text: 'What CIP (cleaning) agents are used in your facility? (type and concentration — relevant for membrane material selection)', type: 'Text', required: false, sectionId: 'fd_s3' },

  { id: createId(), number: 13, text: 'What output quality or concentration do you need to achieve? (target °Brix, protein concentration, permeate TDS, other — specify)', type: 'Text', required: true, sectionId: 'fd_s4' },
  { id: createId(), number: 14, text: 'What regulatory standard must your treated effluent or product meet? (CPCB / FSSAI / State PCB / export market standards — specify)', type: 'Text', required: true, sectionId: 'fd_s4' },
  { id: createId(), number: 15, text: 'Do you require Zero Liquid Discharge (ZLD) for your effluent stream?', type: 'Choice', required: false, sectionId: 'fd_s4' },

  { id: createId(), number: 16, text: 'Target timeline for system commissioning', type: 'Text', required: true, sectionId: 'fd_s5' },
  { id: createId(), number: 17, text: 'Available power supply (kVA) and installation space at site (m²)', type: 'Text', required: false, sectionId: 'fd_s5' },
  { id: createId(), number: 18, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'fd_s5' },
];

// ---------------------------------------------------------------------------
// TEXTILE
// ---------------------------------------------------------------------------
const TEXTILE_SECTIONS: Section[] = [
  { id: 'tx_s1', title: 'SECTION 1: Company & Contact Details', isExpanded: true },
  { id: 'tx_s2', title: 'SECTION 2: Your Process & Effluent Source', isExpanded: true },
  { id: 'tx_s3', title: 'SECTION 3: Effluent Characteristics', isExpanded: true },
  { id: 'tx_s4', title: 'SECTION 4: Treatment Requirements & Compliance Targets', isExpanded: true },
  { id: 'tx_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const TEXTILE_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'tx_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'tx_s1' },
  { id: createId(), number: 3, text: 'What textile processes does your facility operate? (dyeing / printing / finishing / washing / sizing / weaving — specify)', type: 'Text', required: true, sectionId: 'tx_s1' },

  { id: createId(), number: 4, text: 'What types of dyes and chemicals do you use in your process? (reactive / disperse / vat / acid / direct dyes — specify)', type: 'Text', required: true, sectionId: 'tx_s2' },
  { id: createId(), number: 5, text: 'Total daily effluent volume generated from your process (m³/day or KLD)', type: 'Number', required: true, sectionId: 'tx_s2' },
  { id: createId(), number: 6, text: 'Do you have an existing Effluent Treatment Plant (ETP)? If yes, describe the current stages and capacity', type: 'Text', required: false, sectionId: 'tx_s2' },
  { id: createId(), number: 7, text: 'What is your current disposal method for treated or untreated effluent? (discharge to drain / CETP / evaporation pond / other)', type: 'Text', required: false, sectionId: 'tx_s2' },

  { id: createId(), number: 8, text: 'Known parameters of your effluent (pH, COD ppm, BOD ppm, TDS ppm, colour ADMI or visual, TSS mg/L, conductivity µS/cm — attach ETP inlet data if available)', type: 'Table', required: true, sectionId: 'tx_s3' },
  { id: createId(), number: 9, text: 'Is there significant variation in effluent quality across shifts or seasons? Please describe', type: 'Text', required: false, sectionId: 'tx_s3' },
  { id: createId(), number: 10, text: 'Are any hazardous chemicals or heavy metals present in the effluent? (list if known)', type: 'Text', required: false, sectionId: 'tx_s3' },

  { id: createId(), number: 11, text: 'What discharge standard are you required to meet? (CPCB / State PCB / ZLD mandate — specify parameter limits and deadline)', type: 'Text', required: true, sectionId: 'tx_s4' },
  { id: createId(), number: 12, text: 'Are you under a Zero Liquid Discharge (ZLD) mandate? If yes, what is the compliance deadline?', type: 'Choice', required: true, sectionId: 'tx_s4' },
  { id: createId(), number: 13, text: 'What percentage of treated water do you want to recover and reuse in your process?', type: 'Number', required: false, sectionId: 'tx_s4' },
  { id: createId(), number: 14, text: 'What is your target quality for recovered/reused water? (TDS ppm, colour limits, COD — specify)', type: 'Text', required: false, sectionId: 'tx_s4' },

  { id: createId(), number: 15, text: 'Target timeline for achieving compliance or system commissioning', type: 'Text', required: true, sectionId: 'tx_s5' },
  { id: createId(), number: 16, text: 'Available power supply (kVA) and installation space at site (m²)', type: 'Text', required: false, sectionId: 'tx_s5' },
  { id: createId(), number: 17, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'tx_s5' },
];

// ---------------------------------------------------------------------------
// CETP & MUNICIPAL
// ---------------------------------------------------------------------------
const CETP_SECTIONS: Section[] = [
  { id: 'ct_s1', title: 'SECTION 1: Organisation & Contact Details', isExpanded: true },
  { id: 'ct_s2', title: 'SECTION 2: Cluster / Plant Overview', isExpanded: true },
  { id: 'ct_s3', title: 'SECTION 3: Influent Characteristics', isExpanded: true },
  { id: 'ct_s4', title: 'SECTION 4: Treatment Requirements & Compliance Targets', isExpanded: true },
  { id: 'ct_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const CETP_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Name of the CETP / ULB / municipality and location (city, state)', type: 'Text', required: true, sectionId: 'ct_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'ct_s1' },
  { id: createId(), number: 3, text: 'Type of cluster or municipality served (chemical / pharmaceutical / textile / mixed industrial / municipal sewage — specify)', type: 'Text', required: true, sectionId: 'ct_s1' },

  { id: createId(), number: 4, text: 'Total daily influent volume received at your plant (KLD)', type: 'Number', required: true, sectionId: 'ct_s2' },
  { id: createId(), number: 5, text: 'Number of member industries or households contributing to the effluent', type: 'Number', required: false, sectionId: 'ct_s2' },
  { id: createId(), number: 6, text: 'What is the current stage of treatment in your existing plant? (primary / secondary / tertiary — describe briefly)', type: 'Text', required: true, sectionId: 'ct_s2' },
  { id: createId(), number: 7, text: 'What is your current disposal method for treated effluent? (river / irrigation / reuse / evaporation pond / other)', type: 'Text', required: false, sectionId: 'ct_s2' },

  { id: createId(), number: 8, text: 'Typical parameters of effluent after existing treatment (or raw influent if no treatment) — pH, COD ppm, BOD ppm, TDS ppm, TSS mg/L, heavy metals mg/L, conductivity µS/cm — attach data if available', type: 'Table', required: true, sectionId: 'ct_s3' },
  { id: createId(), number: 9, text: 'Are there any specific compounds of concern in the influent? (heavy metals, specific solvents, colour, pharmaceutical residues — list with approximate levels)', type: 'Text', required: false, sectionId: 'ct_s3' },
  { id: createId(), number: 10, text: 'Is there significant variability in influent quality from member industries? Please describe', type: 'Text', required: false, sectionId: 'ct_s3' },

  { id: createId(), number: 11, text: 'What discharge standard are you required to meet? (CPCB / State PCB / ZLD norms — specify parameter limits)', type: 'Text', required: true, sectionId: 'ct_s4' },
  { id: createId(), number: 12, text: 'Are you under a Zero Liquid Discharge (ZLD) mandate? If yes, what is the compliance deadline?', type: 'Choice', required: true, sectionId: 'ct_s4' },
  { id: createId(), number: 13, text: 'What is the intended use of treated permeate? (industrial process water / irrigation / river discharge / other)', type: 'Text', required: true, sectionId: 'ct_s4' },
  { id: createId(), number: 14, text: 'Do you have an existing method for concentrate / reject management? (evaporation / ATFD / landfill / other — describe)', type: 'Text', required: false, sectionId: 'ct_s4' },

  { id: createId(), number: 15, text: 'Target timeline for system commissioning or compliance achievement', type: 'Text', required: true, sectionId: 'ct_s5' },
  { id: createId(), number: 16, text: 'Available power supply (kVA) and installation space at plant site (m²)', type: 'Text', required: false, sectionId: 'ct_s5' },
  { id: createId(), number: 17, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'ct_s5' },
];

// ---------------------------------------------------------------------------
// CHEMICAL PROCESSING
// ---------------------------------------------------------------------------
const CHEMICAL_SECTIONS: Section[] = [
  { id: 'ch_s1', title: 'SECTION 1: Company & Contact Details', isExpanded: true },
  { id: 'ch_s2', title: 'SECTION 2: Your Process & Application', isExpanded: true },
  { id: 'ch_s3', title: 'SECTION 3: Feed Stream Characteristics', isExpanded: true },
  { id: 'ch_s4', title: 'SECTION 4: Treatment Requirements & Output Targets', isExpanded: true },
  { id: 'ch_s5', title: 'SECTION 5: Site & Project Details', isExpanded: true },
];

const CHEMICAL_QUESTIONS: Question[] = [
  { id: createId(), number: 1, text: 'Company name and facility location (city, state)', type: 'Text', required: true, sectionId: 'ch_s1' },
  { id: createId(), number: 2, text: 'Contact person name, designation, and email / phone', type: 'Text', required: true, sectionId: 'ch_s1' },
  { id: createId(), number: 3, text: 'What type of chemical process or product does your facility handle? (specialty chemicals / agrochemicals / solvents / dyes & intermediates / petrochemicals / other — specify)', type: 'Text', required: true, sectionId: 'ch_s1' },

  { id: createId(), number: 4, text: 'Which specific stream or application requires treatment? (solvent recovery / product concentration / effluent ZLD / process water / impurity removal — describe)', type: 'Text', required: true, sectionId: 'ch_s2' },
  { id: createId(), number: 5, text: 'What is your primary objective? (Solvent or product recovery / Product concentration / Effluent treatment & ZLD / Regulatory compliance / Cost reduction / Other)', type: 'Choice', required: true, sectionId: 'ch_s2' },
  { id: createId(), number: 6, text: 'Describe your current handling of this stream', type: 'Text', required: false, sectionId: 'ch_s2' },
  { id: createId(), number: 7, text: 'Do you have an existing treatment or recovery system? If yes, describe briefly', type: 'Text', required: false, sectionId: 'ch_s2' },

  { id: createId(), number: 8, text: 'Volume of stream generated per day or per batch (m³/day or kg/batch)', type: 'Text', required: true, sectionId: 'ch_s3' },
  { id: createId(), number: 9, text: 'What chemicals, solvents, or compounds are present in the feed stream? (list key components with approximate concentrations)', type: 'Text', required: true, sectionId: 'ch_s3' },
  { id: createId(), number: 10, text: 'Known parameters of your feed stream (pH range, COD ppm, TDS ppm, conductivity µS/cm, temperature °C, specific compound concentration — attach lab report if available)', type: 'Table', required: true, sectionId: 'ch_s3' },
  { id: createId(), number: 11, text: 'What are the pH and temperature range of the stream during operation? (important for membrane material selection)', type: 'Text', required: true, sectionId: 'ch_s3' },
  { id: createId(), number: 12, text: 'Are there any aggressive solvents, oxidising agents, or chemicals that could affect membrane materials? (list if known)', type: 'Text', required: false, sectionId: 'ch_s3' },

  { id: createId(), number: 13, text: 'What output do you need to achieve? (recovered solvent purity %, product concentration level, treated effluent quality — specify targets clearly)', type: 'Text', required: true, sectionId: 'ch_s4' },
  { id: createId(), number: 14, text: 'What regulatory discharge standard must be met? (CPCB / State PCB / internal norms — specify parameter limits)', type: 'Text', required: true, sectionId: 'ch_s4' },
  { id: createId(), number: 15, text: 'Do you require Zero Liquid Discharge (ZLD)? If yes, is there a regulatory deadline?', type: 'Choice', required: true, sectionId: 'ch_s4' },

  { id: createId(), number: 16, text: 'Target timeline for system commissioning', type: 'Text', required: true, sectionId: 'ch_s5' },
  { id: createId(), number: 17, text: 'Available power supply (kVA) and installation space at site (m²)', type: 'Text', required: false, sectionId: 'ch_s5' },
  { id: createId(), number: 18, text: 'Any other requirements, constraints, or information you would like us to know?', type: 'Text', required: false, sectionId: 'ch_s5' },
];

// ---------------------------------------------------------------------------
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

const emptyClientInfo = {
  companyName: '',
  contactPerson: '',
  date: new Date().toISOString().split('T')[0],
  location: '',
};

export const DEFAULT_SECTOR_STATES: Record<string, SectorState> = {
  pharma:   { questions: PHARMA_QUESTIONS,   sections: PHARMA_SECTIONS,   clientInfo: deepCopy(emptyClientInfo) },
  dairy:    { questions: DAIRY_QUESTIONS,    sections: DAIRY_SECTIONS,    clientInfo: deepCopy(emptyClientInfo) },
  water:    { questions: WATER_QUESTIONS,    sections: WATER_SECTIONS,    clientInfo: deepCopy(emptyClientInfo) },
  food:     { questions: FOOD_QUESTIONS,     sections: FOOD_SECTIONS,     clientInfo: deepCopy(emptyClientInfo) },
  textile:  { questions: TEXTILE_QUESTIONS,  sections: TEXTILE_SECTIONS,  clientInfo: deepCopy(emptyClientInfo) },
  cetp:     { questions: CETP_QUESTIONS,     sections: CETP_SECTIONS,     clientInfo: deepCopy(emptyClientInfo) },
  chemical: { questions: CHEMICAL_QUESTIONS, sections: CHEMICAL_SECTIONS, clientInfo: deepCopy(emptyClientInfo) },
};
