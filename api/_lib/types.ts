export type AggregatedRecord = {
    rating?: number;
    rank?: number;
};

export const dataTypes = ['player'] as const;
export type DataTypes = typeof dataTypes[number];

export type RankingRecord = {
    rank: number;
    rating: number;
    rule_id: RuleIds;
    start_time: string;
    weapon_id: number;
};

export interface ParsedRequest {
    html: boolean;
    type: DataTypes;
    id: string;
}

export type RequestParam = string | string[];

export const ruleIds = [1, 2, 3, 4] as const;
export type RuleIds = typeof ruleIds[number];
