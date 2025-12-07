import { useMemo, useState } from 'react';
import { Download, Copy, X } from 'lucide-react';
import { useSurveyStore } from '../../store/surveyStore';
import {
 calculateChiSquare,
 calculateCramersV,
 getCramersVInterpretation,
 calculateSpearmanRho,
 getSpearmanInterpretation,
 calculateExpectedFrequencies,
 checkExpectedFrequencyWarning,
 getLabelForValue,
} from '../../utils/calculations';

type AnalysisType = 'frequency' | 'row_pct' | 'col_pct' | 'chi_square' | 'effect_size';

interface Variable {
 key: string;
 label: string;
 type: 'categorical' | 'ordinal';
 values: number[];
 getLabel: (value: number) => string;
}

const VARIABLES: Variable[] = [
 { key: 'age_group', label: 'Age Group', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => getLabelForValue('age_group', v) },
 { key: 'gender', label: 'Gender', type: 'categorical', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('gender', v) },
 { key: 'location', label: 'Location', type: 'categorical', values: [1, 2, 3], getLabel: (v) => getLabelForValue('location', v) },
 { key: 'household_income', label: 'Household Income', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('household_income', v) },
 { key: 'number_of_children', label: 'Number of Children', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('number_of_children', v) },
 { key: 'children_2_7', label: 'Has Children Age 2-7', type: 'categorical', values: [0, 1], getLabel: (v) => v === 1 ? 'Yes' : 'No' },
 { key: 'q19_nps_little_tikes_1_5', label: 'NPS Score (Q19)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Score ${v}` },
 { key: 'nps_category', label: 'NPS Category (Q19)', type: 'categorical', values: [1, 2, 3], getLabel: (v) => ['Detractor', 'Passive', 'Promoter'][v - 1] },
 { key: 'q18_preference_vs_brands_1_3', label: 'Brand Preference (Q18)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => getLabelForValue('q18_preference_vs_brands_1_3', v) },
 { key: 'q8_memories_influence_purchase_1_5', label: 'Memory Influence (Q8)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'memory_influence_binned', label: 'Memory Influence - Binned', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not at All (1)', 'Slightly-Moderately (2-3)', 'Very-Extremely (4-5)'][v - 1] },
 { key: 'q11_nostalgia_quartile', label: 'Nostalgia Quartile', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['Q1 (0-25)', 'Q2 (26-50)', 'Q3 (51-75)', 'Q4 (76-100)'][v - 1] },
 { key: 'q11_nostalgia_little_tikes_0_100', label: 'Nostalgia Intensity (Q11: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'q6_childhood_brand_rank_little_tikes', label: 'LT Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q6_childhood_brand_rank_fisher_price', label: 'Fisher-Price Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q6_childhood_brand_rank_playskool', label: 'Playskool Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q6_childhood_brand_rank_toynado', label: 'Toynado Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q6_childhood_brand_rank_lego', label: 'LEGO Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q6_childhood_brand_rank_other', label: 'Other Brand Childhood Rank (Q6)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q7_memories_childhood_toys_vivid_memories_1_5', label: 'Vivid Toy Memories (Q7a)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'q7_memories_childhood_toys_reminds_childhood_1_5', label: 'Toys Remind of Childhood (Q7b)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'q7_memories_childhood_toys_want_child_experience_1_5', label: 'Want Child to Experience Toys (Q7c)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'q7_memories_childhood_toys_not_relevant_today_1_5', label: 'Toys Not Relevant Today (Q7d)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'q10_rank_attributes_future_1', label: 'Quality/Durability Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q10_rank_attributes_future_2', label: 'Safety/Trust Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q10_rank_attributes_future_3', label: 'Active/Imaginative Play Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q10_rank_attributes_future_4', label: 'Educational/Developmental Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q10_rank_attributes_future_5', label: 'Tech Use Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q10_rank_attributes_future_6', label: 'Childhood Memories Future Rank (Q10)', type: 'ordinal', values: [1, 2, 3, 4, 5, 6], getLabel: (v) => `Rank ${v}` },
 { key: 'q16_competitor_brand_rating_fisher_price_1_5', label: 'Fisher-Price Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_step2_1_5', label: 'Step2 Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_melissa_doug_1_5', label: 'Melissa & Doug Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_lego_1_5', label: 'LEGO Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_tonies_1_5', label: 'Tonies Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_lovevery_1_5', label: 'Lovevery Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_toynado_1_5', label: 'Toynado Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q16_competitor_brand_rating_little_tikes_1_5', label: 'LT Competitor Rating (Q16)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Rating ${v}` },
 { key: 'q12_little_tikes_represents', label: 'Brand Perception (Q12)', type: 'categorical', values: [1, 2, 3, 4, 5], getLabel: (v) => getLabelForValue('q12_little_tikes_represents', v) },
 { key: 'q17_future_directions_excitement_1_4', label: 'Future Direction Preference (Q17)', type: 'categorical', values: [1, 2, 3, 4], getLabel: (v) => getLabelForValue('q17_future_directions_excitement_1_4', v) },
 { key: 'q13_emotional_impact_makes_nostalgic_1_5', label: 'Nostalgia Feel (Q13a)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'nostalgia_feel_binned', label: 'Nostalgia Feel - Binned (Q13a)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q13_emotional_impact_nostalgia_buy_likelihood_1_5', label: 'Nostalgia Purchase Lift (Q13b)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'nostalgia_purchase_binned', label: 'Nostalgia Purchase Lift - Binned (Q13b)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q13_emotional_impact_trust_vs_newer_1_5', label: 'Nostalgia Trust Lift (Q13c)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'nostalgia_trust_binned', label: 'Nostalgia Trust Lift - Binned (Q13c)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q14_perception_brand_feels_modern_1_5', label: 'Modernness Perception (Q14a)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'modernness_binned', label: 'Modernness Perception - Binned (Q14a)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q14_perception_brand_incorporate_technology_1_5', label: 'Tech Innovation Appetite (Q14b)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'tech_innovation_binned', label: 'Tech Innovation Appetite - Binned (Q14b)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q14_perception_brand_keep_traditional_1_5', label: 'Traditional Look Preference (Q14c)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'traditional_preference_binned', label: 'Traditional Look Preference - Binned (Q14c)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q14_perception_brand_trendy_social_media_1_5', label: 'Social-Media Relevance (Q14d)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'social_media_relevance_binned', label: 'Social-Media Relevance - Binned (Q14d)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Disagree (1-2)', 'Neutral (3)', 'Agree (4-5)'][v - 1] },
 { key: 'q9_importance_quality_durability_1_5', label: 'Quality & Durability Importance (Q9a)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'quality_importance_binned', label: 'Quality & Durability Importance - Binned (Q9a)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q9_importance_safety_trust_1_5', label: 'Safety & Trust Importance (Q9b)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'safety_importance_binned', label: 'Safety & Trust Importance - Binned (Q9b)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q9_importance_active_imaginative_play_1_5', label: 'Imaginative Play Importance (Q9c)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'imaginative_play_importance_binned', label: 'Imaginative Play Importance - Binned (Q9c)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q9_importance_educational_developmental_1_5', label: 'Educational Value Importance (Q9d)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'educational_importance_binned', label: 'Educational Value Importance - Binned (Q9d)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q9_importance_use_of_technology_1_5', label: 'Tech Importance (Q9e)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'tech_importance_binned', label: 'Tech Importance - Binned (Q9e)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q9_importance_childhood_memories_1_5', label: 'Childhood Memories Importance (Q9f)', type: 'ordinal', values: [1, 2, 3, 4, 5], getLabel: (v) => `Level ${v}` },
 { key: 'memories_importance_binned', label: 'Childhood Memories Importance - Binned (Q9f)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Not Important (1-2)', 'Moderate (3)', 'Very Important (4-5)'][v - 1] },
 { key: 'q15a_quartile', label: 'LT Durability Rating Quartile (Q15a: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_durability_binned', label: 'LT Durability Rating - Binned (Q15a)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'q15b_quartile', label: 'LT Safety Rating Quartile (Q15b: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_safety_binned', label: 'LT Safety Rating - Binned (Q15b)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'q15c_quartile', label: 'LT Imaginative Play Rating Quartile (Q15c: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_imaginative_play_binned', label: 'LT Imaginative Play Rating - Binned (Q15c)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'q15d_quartile', label: 'LT Educational Rating Quartile (Q15d: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_educational_binned', label: 'LT Educational Rating - Binned (Q15d)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'q15e_quartile', label: 'LT Tech Rating Quartile (Q15e: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_tech_binned', label: 'LT Tech Rating - Binned (Q15e)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'q15f_quartile', label: 'LT Childhood Memories Rating Quartile (Q15f: 0-100)', type: 'ordinal', values: [1, 2, 3, 4], getLabel: (v) => ['0-25', '26-50', '51-75', '76-100'][v - 1] },
 { key: 'lt_childhood_memories_binned', label: 'LT Childhood Memories Rating - Binned (Q15f)', type: 'ordinal', values: [1, 2, 3], getLabel: (v) => ['Low (0-50)', 'Medium (51-75)', 'High (76-100)'][v - 1] },
 { key: 'primary_platform', label: 'Primary Parenting Platform (Q5)', type: 'categorical', values: [1, 2, 3, 4, 5, 6, 7], getLabel: (v) => ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Blogs/Websites', 'Texts/Group Chats', 'Other'][v - 1] },
];

export const CrossTabAnalysisSection = () => {
 const { filteredData } = useSurveyStore();
 const [rowVar, setRowVar] = useState<string>('age_group');
 const [colVar, setColVar] = useState<string>('q19_nps_little_tikes_1_5');
 const [analysisType, setAnalysisType] = useState<AnalysisType>('row_pct');
 const [showResults, setShowResults] = useState(true);
 const [showVariableList, setShowVariableList] = useState(false);

 const enrichedData = useMemo(() => {
  return filteredData.map(row => {
   const binLikert = (val: number) => {
    if (val <= 2) return 1;
    if (val === 3) return 2;
    return 3;
   };

   const bin0to100 = (val: number) => {
    if (val <= 50) return 1;
    if (val <= 75) return 2;
    return 3;
   };

   const quartile0to100 = (val: number) => {
    if (val <= 25) return 1;
    if (val <= 50) return 2;
    if (val <= 75) return 3;
    return 4;
   };

   const nostalgia = row.q11_nostalgia_little_tikes_0_100;
   let quartile = 1;
   if (nostalgia > 75) quartile = 4;
   else if (nostalgia > 50) quartile = 3;
   else if (nostalgia > 25) quartile = 2;

   const memoryInfluence = row.q8_memories_influence_purchase_1_5;
   let memoryInfluenceBinned = 1;
   if (memoryInfluence >= 4) memoryInfluenceBinned = 3;
   else if (memoryInfluence === 3 || memoryInfluence === 2) memoryInfluenceBinned = 2;

   const npsScore = row.q19_nps_little_tikes_1_5;
   let npsCategory = 2;
   if (npsScore <= 2) npsCategory = 1;
   else if (npsScore >= 4) npsCategory = 3;

   const platforms = row.platforms_selections ? String(row.platforms_selections).split(',') : [];
   const platformMap: Record<string, number> = {
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7
   };
   const primaryPlatform = platforms.length > 0 ? (platformMap[platforms[0]] || 1) : 1;

   return {
    ...row,
    q11_nostalgia_quartile: quartile,
    memory_influence_binned: memoryInfluenceBinned,
    nps_category: npsCategory,
    primary_platform: primaryPlatform,
    nostalgia_feel_binned: binLikert(row.q13_emotional_impact_makes_nostalgic_1_5),
    nostalgia_purchase_binned: binLikert(row.q13_emotional_impact_nostalgia_buy_likelihood_1_5),
    nostalgia_trust_binned: binLikert(row.q13_emotional_impact_trust_vs_newer_1_5),
    modernness_binned: binLikert(row.q14_perception_brand_feels_modern_1_5),
    tech_innovation_binned: binLikert(row.q14_perception_brand_incorporate_technology_1_5),
    traditional_preference_binned: binLikert(row.q14_perception_brand_keep_traditional_1_5),
    social_media_relevance_binned: binLikert(row.q14_perception_brand_trendy_social_media_1_5),
    quality_importance_binned: binLikert(row.q9_importance_quality_durability_1_5),
    safety_importance_binned: binLikert(row.q9_importance_safety_trust_1_5),
    imaginative_play_importance_binned: binLikert(row.q9_importance_active_imaginative_play_1_5),
    educational_importance_binned: binLikert(row.q9_importance_educational_developmental_1_5),
    tech_importance_binned: binLikert(row.q9_importance_use_of_technology_1_5),
    memories_importance_binned: binLikert(row.q9_importance_childhood_memories_1_5),
    q15a_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_quality_durability_0_100),
    q15b_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_safety_trust_0_100),
    q15c_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_active_imaginative_play_0_100),
    q15d_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_educational_developmental_0_100),
    q15e_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_use_of_technology_0_100),
    q15f_quartile: quartile0to100(row.q15_lt_rating_vs_competitors_childhood_memories_0_100),
    lt_durability_binned: bin0to100(row.q15_lt_rating_vs_competitors_quality_durability_0_100),
    lt_safety_binned: bin0to100(row.q15_lt_rating_vs_competitors_safety_trust_0_100),
    lt_imaginative_play_binned: bin0to100(row.q15_lt_rating_vs_competitors_active_imaginative_play_0_100),
    lt_educational_binned: bin0to100(row.q15_lt_rating_vs_competitors_educational_developmental_0_100),
    lt_tech_binned: bin0to100(row.q15_lt_rating_vs_competitors_use_of_technology_0_100),
    lt_childhood_memories_binned: bin0to100(row.q15_lt_rating_vs_competitors_childhood_memories_0_100),
   };
  });
 }, [filteredData]);

 const crossTabData = useMemo(() => {
  if (!rowVar || !colVar || !showResults) return null;

  const rowVariable = VARIABLES.find(v => v.key === rowVar);
  const colVariable = VARIABLES.find(v => v.key === colVar);

  if (!rowVariable || !colVariable) return null;

  const observed: number[][] = [];
  const rowLabels: string[] = [];
  const colLabels: string[] = [];

  rowVariable.values.forEach((rowVal, i) => {
   rowLabels.push(rowVariable.getLabel(rowVal));
   observed[i] = [];

   colVariable.values.forEach((colVal, j) => {
    if (i === 0) colLabels.push(colVariable.getLabel(colVal));

    const count = enrichedData.filter(d => {
     const rowData = d[rowVar as keyof typeof d];
     const colData = d[colVar as keyof typeof d];
     return rowData === rowVal && colData === colVal;
    }).length;

    observed[i][j] = count;
   });
  });

  const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
  const colTotals: number[] = [];
  for (let j = 0; j < colVariable.values.length; j++) {
   colTotals[j] = observed.reduce((sum, row) => sum + row[j], 0);
  }
  const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);

  const expected = calculateExpectedFrequencies(observed);
  const chiSquareResult = calculateChiSquare(observed, expected);
  const cramersV = calculateCramersV(chiSquareResult.chiSquare, grandTotal, observed.length, observed[0].length);
  const hasExpectedWarning = checkExpectedFrequencyWarning(expected);

  let spearmanResult = null;
  if (rowVariable.type === 'ordinal' && colVariable.type === 'ordinal') {
   const xValues: number[] = [];
   const yValues: number[] = [];

   enrichedData.forEach(d => {
    const xVal = d[rowVar as keyof typeof d] as number;
    const yVal = d[colVar as keyof typeof d] as number;
    if (xVal !== undefined && yVal !== undefined) {
     xValues.push(xVal);
     yValues.push(yVal);
    }
   });

   spearmanResult = calculateSpearmanRho(xValues, yValues);
  }

  return {
   rowVariable,
   colVariable,
   observed,
   expected,
   rowLabels,
   colLabels,
   rowTotals,
   colTotals,
   grandTotal,
   chiSquareResult,
   cramersV,
   hasExpectedWarning,
   spearmanResult,
  };
 }, [enrichedData, rowVar, colVar, showResults]);

 const getCellValue = (rowIdx: number, colIdx: number): string => {
  if (!crossTabData) return '';

  const { observed, rowTotals, colTotals } = crossTabData;
  const count = observed[rowIdx][colIdx];

  switch (analysisType) {
   case 'frequency':
    return String(count);
   case 'row_pct':
    return `${((count / rowTotals[rowIdx]) * 100).toFixed(1)}%`;
   case 'col_pct':
    return `${((count / colTotals[colIdx]) * 100).toFixed(1)}%`;
   case 'chi_square':
   case 'effect_size':
    return `${count} (${((count / crossTabData.grandTotal) * 100).toFixed(1)}%)`;
   default:
    return String(count);
  }
 };

 const getIntensityColor = (rowIdx: number, colIdx: number): string => {
  if (!crossTabData) return 'bg-gray-50';

  const { observed, expected } = crossTabData;
  const obs = observed[rowIdx][colIdx];
  const exp = expected[rowIdx][colIdx];

  if (exp === 0) return 'bg-gray-50';

  const ratio = obs / exp;

  if (ratio > 1.5) return 'bg-green-200 bg-green-200';
  if (ratio > 1.2) return 'bg-green-100 bg-green-200/50';
  if (ratio > 0.8) return 'bg-gray-50';
  if (ratio > 0.5) return 'bg-red-100 bg-red-100';
  return 'bg-red-200 bg-red-200';
 };

 const generateSummary = (): string => {
  if (!crossTabData) return '';

  const { rowVariable, colVariable, chiSquareResult, cramersV, spearmanResult, hasExpectedWarning } = crossTabData;
  const sigLevel = chiSquareResult.pValue < 0.001 ? '***' : chiSquareResult.pValue < 0.01 ? '**' : chiSquareResult.pValue < 0.05 ? '*' : '';
  const isSignificant = chiSquareResult.pValue <= 0.05;

  const getVStrength = (v: number): string => {
    if (v < 0.10) return 'negligible';
    if (v >= 0.10 && v < 0.20) return 'weak';
    if (v >= 0.20 && v <= 0.40) return 'moderate';
    return 'strong';
  };

  const getRhoStrength = (rho: number): string => {
    const absRho = Math.abs(rho);
    if (absRho < 0.30) return 'weak';
    if (absRho < 0.60) return 'moderate';
    return 'strong';
  };

  let summary = `There is ${isSignificant ? 'a statistically significant' : 'no statistically significant'} association between ${rowVariable.label} and ${colVariable.label} `;
  summary += `(χ²=${chiSquareResult.chiSquare.toFixed(2)}, df=${chiSquareResult.df}, p=${chiSquareResult.pValue.toFixed(4)}${sigLevel}, V=${cramersV.toFixed(2)}). `;
  summary += `The effect size is ${getVStrength(cramersV)}`;

  if (spearmanResult) {
   const rhoSignificant = spearmanResult.pValue <= 0.05;
   const direction = spearmanResult.rho > 0 ? 'positive' : 'negative';
   const strength = getRhoStrength(spearmanResult.rho);

   if (rhoSignificant) {
    summary += `. The ordinal association is a ${strength} ${direction} correlation (ρ=${spearmanResult.rho.toFixed(3)}, p=${spearmanResult.pValue.toFixed(4)})`;
   } else {
    summary += `. The ordinal association is not statistically significant (ρ=${spearmanResult.rho.toFixed(3)}, p=${spearmanResult.pValue.toFixed(4)})`;
   }
  }

  summary += '.';

  if (hasExpectedWarning) {
   summary += ' Results should be interpreted with caution because more than 20 percent of cells have expected counts below 5.';
  }

  return summary;
 };

 const exportCrossTab = () => {
  if (!crossTabData) return;

  const { rowLabels, colLabels, observed, rowTotals, colTotals, grandTotal, chiSquareResult, cramersV } = crossTabData;

  const headers = ['', ...colLabels, 'Total'];
  const rows = rowLabels.map((label, i) => [
   label,
   ...observed[i].map(String),
   String(rowTotals[i])
  ]);
  rows.push(['Total', ...colTotals.map(String), String(grandTotal)]);
  rows.push([]);
  rows.push(['Chi-Square', String(chiSquareResult.chiSquare.toFixed(3))]);
  rows.push(['df', String(chiSquareResult.df)]);
  rows.push(['p-value', String(chiSquareResult.pValue.toFixed(4))]);
  rows.push(['Cramér\'s V', String(cramersV.toFixed(3))]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crosstab_${rowVar}_${colVar}.csv`;
  a.click();
  URL.revokeObjectURL(url);
 };

 const copyStatsToClipboard = () => {
  if (!crossTabData) return;

  const { chiSquareResult, cramersV, spearmanResult } = crossTabData;
  const sigLevel = chiSquareResult.pValue < 0.001 ? '***' : chiSquareResult.pValue < 0.01 ? '**' : chiSquareResult.pValue < 0.05 ? '*' : '';

  let text = `Chi-Square Test Results:\n`;
  text += `χ² = ${chiSquareResult.chiSquare.toFixed(3)}\n`;
  text += `df = ${chiSquareResult.df}\n`;
  text += `p = ${chiSquareResult.pValue.toFixed(4)}${sigLevel}\n`;
  text += `Cramér's V = ${cramersV.toFixed(3)}\n`;
  text += `Effect Size: ${getCramersVInterpretation(cramersV)}\n`;

  if (spearmanResult) {
   text += `\nSpearman's Rho:\n`;
   text += `ρ = ${spearmanResult.rho.toFixed(3)}\n`;
   text += `p = ${spearmanResult.pValue.toFixed(4)}\n`;
   text += `95% CI: [${spearmanResult.ci95[0].toFixed(3)} - ${spearmanResult.ci95[1].toFixed(3)}]\n`;
  }

  navigator.clipboard.writeText(text);
 };

 const renderVariableList = () => (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Variable Definitions & Sources</h3>
        <button
          onClick={() => setShowVariableList(!showVariableList)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          {showVariableList ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Hide Variables
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Show All Variables ({VARIABLES.length})
            </>
          )}
        </button>
      </div>
      {showVariableList && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Variable Label</th>
                <th className="px-4 py-2">Source Column</th>
                <th className="px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLES.map((v) => (
                <tr key={v.key} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{v.label}</td>
                  <td className="px-4 py-2 font-mono text-xs">{v.key}</td>
                  <td className="px-4 py-2 capitalize">{v.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

 const predefinedCrossTabs = [
  { row: 'age_group', col: 'nps_category', label: 'Age × NPS Category' },
  { row: 'gender', col: 'nps_category', label: 'Gender × NPS Category' },
  { row: 'household_income', col: 'nps_category', label: 'Income × NPS Category' },
  { row: 'primary_platform', col: 'nps_category', label: 'Platform × NPS Category' },
  { row: 'nostalgia_feel_binned', col: 'nps_category', label: 'Nostalgia Feel × NPS' },
  { row: 'nostalgia_purchase_binned', col: 'q18_preference_vs_brands_1_3', label: 'Nostalgia Purchase Lift × Preference' },
  { row: 'nostalgia_trust_binned', col: 'nps_category', label: 'Nostalgia Trust × NPS' },
  { row: 'traditional_preference_binned', col: 'age_group', label: 'Traditional Preference × Age' },
  { row: 'modernness_binned', col: 'age_group', label: 'Modernness × Age' },
  { row: 'social_media_relevance_binned', col: 'primary_platform', label: 'Social Media Relevance × Platform' },
  { row: 'quality_importance_binned', col: 'lt_durability_binned', label: 'Quality Importance × LT Durability' },
  { row: 'safety_importance_binned', col: 'lt_safety_binned', label: 'Safety Importance × LT Safety' },
  { row: 'educational_importance_binned', col: 'lt_educational_binned', label: 'Educational Importance × LT Educational' },
  { row: 'tech_importance_binned', col: 'lt_tech_binned', label: 'Tech Importance × LT Tech Rating' },
  { row: 'q17_future_directions_excitement_1_4', col: 'age_group', label: 'Future Direction × Age' },
  { row: 'q12_little_tikes_represents', col: 'nps_category', label: 'Brand Perception × NPS' },
  { row: 'imaginative_play_importance_binned', col: 'lt_imaginative_play_binned', label: 'Imag. Play Importance × LT Rating' },
  { row: 'memories_importance_binned', col: 'nostalgia_feel_binned', label: 'Memory Importance × Nostalgia Feel' },
 ];

 return (
  <section className="bg-white shadow-lg rounded-lg p-6">
   <h2 className="text-2xl font-bold text-gray-800 mb-2">Cross-Tabulation Analysis Engine</h2>
   <p className="text-sm text-gray-600 mb-6">Interactive cross-tabulation of any two survey variables with Chi-Square and Spearman correlation analysis</p>

   <div className="bg-gray-50 p-6 rounded-lg mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Cross-Tab Builder</h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Row Variable
      </label>
      <select
       value={rowVar}
       onChange={(e) => setRowVar(e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       {VARIABLES.map(v => (
        <option key={v.key} value={v.key}>{v.label}</option>
       ))}
      </select>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Column Variable
      </label>
      <select
       value={colVar}
       onChange={(e) => setColVar(e.target.value)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       {VARIABLES.map(v => (
        <option key={v.key} value={v.key}>{v.label}</option>
       ))}
      </select>
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
       Analysis Type
      </label>
      <select
       value={analysisType}
       onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
       className="w-full px-3 py-2 border border-gray-300 rounded bg-white shadow-lg text-gray-800"
      >
       <option value="frequency">Frequency (Counts)</option>
       <option value="row_pct">Row Percentage</option>
       <option value="col_pct">Column Percentage</option>
       <option value="chi_square">Chi-Square Stats</option>
       <option value="effect_size">Effect Size Analysis</option>
      </select>
     </div>
    </div>

    <div className="flex gap-3">
     <button
      onClick={() => setShowResults(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
     >
      Generate Cross-Tab
     </button>
     <button
      onClick={() => setShowResults(false)}
      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
     >
      <X size={16} />
      Clear Selection
     </button>
    </div>

    <div className="mt-4 no-pdf-export">
     <div className="text-sm font-medium text-gray-700 mb-2">Quick Select Pre-Defined:</div>
     <div className="flex flex-wrap gap-2">
      {predefinedCrossTabs.map((preset, idx) => (
       <button
        key={idx}
        onClick={() => {
         setRowVar(preset.row);
         setColVar(preset.col);
         setShowResults(true);
        }}
        className="px-3 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
       >
        {preset.label}
       </button>
      ))}
     </div>
    </div>
   </div>

   {crossTabData && showResults && (
    <>
     <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Contingency Table</h3>
      <div className="overflow-x-auto">
       <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-100">
         <tr>
          <th className="p-2 border border-gray-300 text-left">
           {crossTabData.rowVariable.label} \ {crossTabData.colVariable.label}
          </th>
          {crossTabData.colLabels.map((label, idx) => (
           <th key={idx} className="p-2 border border-gray-300 text-center">{label}</th>
          ))}
          <th className="p-2 border border-gray-300 text-center font-bold">Total</th>
         </tr>
        </thead>
        <tbody>
         {crossTabData.rowLabels.map((rowLabel, i) => (
          <tr key={i}>
           <td className="p-2 border border-gray-300 font-medium">{rowLabel}</td>
           {crossTabData.colLabels.map((_, j) => (
            <td
             key={j}
             className={`p-2 border border-gray-300 text-center ${getIntensityColor(i, j)}`}
            >
             {getCellValue(i, j)}
            </td>
           ))}
           <td className="p-2 border border-gray-300 text-center font-bold bg-gray-100">
            {crossTabData.rowTotals[i]}
           </td>
          </tr>
         ))}
         <tr className="bg-gray-100 font-bold">
          <td className="p-2 border border-gray-300">Total</td>
          {crossTabData.colTotals.map((total, idx) => (
           <td key={idx} className="p-2 border border-gray-300 text-center">{total}</td>
          ))}
          <td className="p-2 border border-gray-300 text-center">{crossTabData.grandTotal}</td>
         </tr>
        </tbody>
       </table>
      </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Chi-Square Test</h3>
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span>χ² (Chi-square):</span>
         <span className="font-bold">{crossTabData.chiSquareResult.chiSquare.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
         <span>df (Degrees of Freedom):</span>
         <span className="font-bold">{crossTabData.chiSquareResult.df}</span>
        </div>
        <div className="flex justify-between">
         <span>p-value:</span>
         <span className="font-bold">
          {crossTabData.chiSquareResult.pValue.toFixed(4)}
          {crossTabData.chiSquareResult.pValue < 0.001 && ' ***'}
          {crossTabData.chiSquareResult.pValue >= 0.001 && crossTabData.chiSquareResult.pValue < 0.01 && ' **'}
          {crossTabData.chiSquareResult.pValue >= 0.01 && crossTabData.chiSquareResult.pValue < 0.05 && ' *'}
         </span>
        </div>
        <div className="pt-2 border-t border-blue-200 ">
         <div className="font-semibold">
          {crossTabData.chiSquareResult.pValue < 0.05 ? 'Statistically Significant' : 'No Significant Association'}
         </div>
        </div>
        <div className="flex justify-between">
         <span>Sample Size (N):</span>
         <span className="font-bold">{crossTabData.grandTotal}</span>
        </div>
        {crossTabData.hasExpectedWarning && (
         <div className="pt-2 text-xs text-yellow-700 ">
          ⚠️ Warning: &gt;20% of cells have expected count &lt; 5
         </div>
        )}
       </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded p-4">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Effect Size</h3>
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span>Cramér's V:</span>
         <span className="font-bold text-xl">{crossTabData.cramersV.toFixed(3)}</span>
        </div>
        <div className="pt-2 border-t border-green-200 ">
         <div className="font-semibold">{getCramersVInterpretation(crossTabData.cramersV)}</div>
        </div>
        <div className="text-xs mt-3 space-y-1">
         <div>V &lt; 0.10 = Negligible</div>
         <div>V 0.10-0.20 = Weak</div>
         <div>V 0.20-0.40 = Moderate</div>
         <div>V &gt; 0.40 = Strong</div>
        </div>
       </div>
      </div>
     </div>

     {crossTabData.spearmanResult && (
      <div className="bg-purple-50 border border-purple-200 rounded p-4 mb-6">
       <h3 className="text-lg font-semibold text-gray-800 mb-3">Ordinal Association (Spearman's Rho)</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
         <div className="flex justify-between mb-2">
          <span>ρ (Spearman's Rho):</span>
          <span className="font-bold text-xl">{crossTabData.spearmanResult.rho.toFixed(3)}</span>
         </div>
         <div className="flex justify-between mb-2">
          <span>p-value:</span>
          <span className="font-bold">{crossTabData.spearmanResult.pValue.toFixed(4)}</span>
         </div>
         <div className="flex justify-between">
          <span>95% CI:</span>
          <span className="font-bold">
           [{crossTabData.spearmanResult.ci95[0].toFixed(3)} - {crossTabData.spearmanResult.ci95[1].toFixed(3)}]
          </span>
         </div>
        </div>
        <div>
         <div className="font-semibold mb-2">Interpretation:</div>
         <div>{getSpearmanInterpretation(crossTabData.spearmanResult.rho)}</div>
        </div>
       </div>
      </div>
     )}

     <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary Interpretation</h3>
      <p className="text-sm text-gray-700">{generateSummary()}</p>
     </div>

     <div className="flex gap-3">
      <button
       onClick={exportCrossTab}
       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
      >
       <Download size={16} />
       Save This Cross-Tab
      </button>
      <button
       onClick={copyStatsToClipboard}
       className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
      >
       <Copy size={16} />
       Copy Stats to Clipboard
      </button>
     </div>
    </>
   )}
   {renderVariableList()}
  </section>
 );
};
