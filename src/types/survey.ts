export interface SurveyResponse {
  q_id: string;
  children_2_7: number;
  number_of_children: number;
  age_group: number;
  gender: number;
  location: number;
  household_income: number;
  platforms_selections: string;
  platforms_other_text: string;
  q6_childhood_brand_rank_little_tikes: number;
  q6_childhood_brand_rank_fisher_price: number;
  q6_childhood_brand_rank_playskool: number;
  q6_childhood_brand_rank_toynado: number;
  q6_childhood_brand_rank_lego: number;
  q6_childhood_brand_rank_other: number;
  q6_childhood_brand_other_text: string;
  q7_memories_childhood_toys_vivid_memories_1_5: number;
  q7_memories_childhood_toys_reminds_childhood_1_5: number;
  q7_memories_childhood_toys_want_child_experience_1_5: number;
  q7_memories_childhood_toys_not_relevant_today_1_5: number;
  q8_memories_influence_purchase_1_5: number;
  q9_importance_quality_durability_1_5: number;
  q9_importance_safety_trust_1_5: number;
  q9_importance_active_imaginative_play_1_5: number;
  q9_importance_educational_developmental_1_5: number;
  q9_importance_use_of_technology_1_5: number;
  q9_importance_childhood_memories_1_5: number;
  q10_rank_attributes_future_1: number;
  q10_rank_attributes_future_2: number;
  q10_rank_attributes_future_3: number;
  q10_rank_attributes_future_4: number;
  q10_rank_attributes_future_5: number;
  q10_rank_attributes_future_6: number;
  q11_nostalgia_little_tikes_0_100: number;
  q12_little_tikes_represents: number;
  q13_emotional_impact_makes_nostalgic_1_5: number;
  q13_emotional_impact_nostalgia_buy_likelihood_1_5: number;
  q13_emotional_impact_trust_vs_newer_1_5: number;
  q14_perception_brand_feels_modern_1_5: number;
  q14_perception_brand_incorporate_technology_1_5: number;
  q14_perception_brand_keep_traditional_1_5: number;
  q14_perception_brand_trendy_social_media_1_5: number;
  q15_lt_rating_vs_competitors_quality_durability_0_100: number;
  q15_lt_rating_vs_competitors_safety_trust_0_100: number;
  q15_lt_rating_vs_competitors_active_imaginative_play_0_100: number;
  q15_lt_rating_vs_competitors_educational_developmental_0_100: number;
  q15_lt_rating_vs_competitors_use_of_technology_0_100: number;
  q15_lt_rating_vs_competitors_childhood_memories_0_100: number;
  q16_competitor_brand_rating_fisher_price_1_5: number;
  q16_competitor_brand_rating_step2_1_5: number;
  q16_competitor_brand_rating_melissa_doug_1_5: number;
  q16_competitor_brand_rating_lego_1_5: number;
  q16_competitor_brand_rating_tonies_1_5: number;
  q16_competitor_brand_rating_lovevery_1_5: number;
  q16_competitor_brand_rating_toynado_1_5: number;
  q16_competitor_brand_rating_little_tikes_1_5: number;
  q17_future_directions_excitement_1_4: number;
  q18_preference_vs_brands_1_3: number;
  q19_nps_little_tikes_1_5: number;
}

export interface FilterState {
  ageGroups: number[];
  genders: number[];
  locations: number[];
  incomes: number[];
  npsRange: [number, number];
  nostalgiaRange: [number, number];
  hasChildren27: 'all' | 'yes' | 'no';
  numberOfChildren: number[];
}

export interface DerivedIndices {
  nostalgiaIntensity: number;
  brandTrust: number;
  purchaseIntent: number;
  modernizationScore: number;
  competitiveStrength: number;
  attributePriority: Record<string, number>;
  parentProfile: string;
  digitalAdoption: number;
}
