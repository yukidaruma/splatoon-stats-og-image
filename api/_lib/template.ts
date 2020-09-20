import { sanitizeHtml } from './sanitizer';
import client from './splatoon-stats';
import { AggregatedRecord, RankingRecord, RuleIds, ParsedRequest, ruleIds } from './types';

const xWeaponWeight = 50;
const favoriteWeaponCount = 3;

function getCss(): string {
    const dark = '#191b22';
    const darkSlightAccent = '#20232c';
    const darkAccent = '#282a36';
    const darkMoreAccent = '#3e4153';
    const light = '#f8f8f2';
    // const lightAccent = 'rgb(255, 255, 255)';

    return `
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    html {
        background: black;
    }

    body {
        font-family: 'Noto Sans JP';
        background: ${dark};
        color: ${light};
        font-size: 40px;
        height: 630px;
        width: 1200px;
    }

    #container{
        height: 100%;
        display: flex;
        justify-content: space-around;
        flex-direction: column;
        padding: 20px 80px;
    }

    #name {
        font-size: 64px;
        font-weight: bold;
    }

    #data {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    #powers {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .heading {
        font-size: 52px;
        font-weight: bold;
        padding-left: 30px;
        border-left: 18px solid;
    }
    .heading.x {
        border-left-color: rgb(249, 114, 7);
    }
    .heading.league {
        border-left-color: rgb(228, 24, 113);
    }

    #weapons {
        display: flex;
    }
    .weapon {
        background-color: ${darkAccent};
        border: solid ${darkSlightAccent};
        border-radius: 50%;
        padding: 8px;
        height: 100px;
        width: 100px;
    }
    .weapon:not(:first-child) {
        margin-left: 32px;
    }
    .weapon img {
        width: 100%;
        height: 100%;
    }

    table {
        margin-top: 24px;
        margin-left: 48px;
        border-collapse: collapse;
    }

    td {
        line-height: 200%;
        background-color: ${darkAccent};
        border: 2px solid ${darkSlightAccent};
    }
    td:nth-child(1) {
        text-align: center;
        width: 120px;
    }
    td:nth-child(2) {
        text-align: center;
        width: 120px;
    }
    td:nth-child(3) {
        text-align: center;
        width: 200px;
    }

    .shadowed {
        text-shadow:
            2px  2px 1px ${dark},
            -2px  2px 1px ${dark},
            2px -2px 1px ${dark},
            -2px -2px 1px ${dark},
            2px  0px 1px ${dark},
            0px  2px 1px ${dark},
            -2px  0px 1px ${dark},
            0px -2px 1px ${dark};
    }`;
}

function uniqueCharacters(text: string): string {
    return Array.from(new Set(text.split(''))).join('');
};

export async function getHtml(parsedReq: ParsedRequest): Promise<string> {
    let content: string;
    const { id } = parsedReq;

    switch (parsedReq.type) {
        case 'player':
            content = await getPlayerContent(id);
    }

    const text = encodeURIComponent(uniqueCharacters(content));

    return `<!DOCTYPE html>
<html>
    <meta charset="utf-8">
    <title>Generated Image</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP&text=${sanitizeHtml(text)}" rel="stylesheet">
    <style>
        ${getCss()}
    </style>
    <body>
        <div id="container">
            ${content}
        </div>
    </body>
</html>`;
}

const ruleNames = {
    1: 'SZ',
    2: 'TC',
    3: 'RM',
    4: 'CB',
} as const;

const ruleColors = {
    1: '#d62c1a',
    2: '#25a25a',
    3: '#217dbb',
    4: '#c29d0b',
} as const;

function findFavoriteWeapons(weapons: Record<string | number, number>) {
    const entries = Object.entries(weapons);
    const result = [] as Array<[string, number]>;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        result.push(entry);

        if (result.length > favoriteWeaponCount) {
            result.sort(function ([a], [b]) { return weapons[b] - weapons[a]; });
            result.pop();
        }
    }

    return result;
}

function getWeaponImageUrl(id: number | string): string {
    return `${process.env.SPLATOON_STATS_API_URL}/static/images/weapon/${id}.png`;
}

function aggregateRule(records: RankingRecord[], weaponWeight = 1) {
    const highestOfRules: Record<RuleIds, AggregatedRecord> = Object.fromEntries(ruleIds.map((rule) => [rule, {}])) as Record<RuleIds, AggregatedRecord>;
    const weapons = {} as Record<number, number>;

    records.forEach(({ rank, rating, rule_id, weapon_id }) => {
        weapons[weapon_id] = (weapons[weapon_id] ?? 0) + weaponWeight;

        if (rating > (highestOfRules[rule_id].rating ?? 0)) {
            highestOfRules[rule_id].rating = rating;
        }
        if (rank < (highestOfRules[rule_id].rank ?? Number.MAX_SAFE_INTEGER)) {
            highestOfRules[rule_id].rank = rank;
        }
    });

    return { highestOfRules, weapons };
}

function sumObjectsByKey(...objs: Record<any, number>[]) {
    return objs.reduce((a, b) => {
        for (let k in b) {
            if (b.hasOwnProperty(k)) {
                a[k] = (a[k] || 0) + b[k];
            }
        }

        return a;
    }, {});
}

async function getPlayerContent(id: string): Promise<string> {
    const [names, leagueRecords, xRecords] = await Promise.all([
        client(`/players/${id}/known_names`) as Promise<Array<{ player_name: string }>>,
        client(`/players/${id}/rankings/league`) as Promise<RankingRecord[]>,
        client(`/players/${id}/rankings/x`) as Promise<RankingRecord[]>,
    ]);
    const name = names[0]?.player_name ?? id;

    const leagueAggregated = aggregateRule(leagueRecords);
    const xAggregated = aggregateRule(xRecords, xWeaponWeight);

    const weaponUsage = sumObjectsByKey(xAggregated.weapons, leagueAggregated.weapons);
    const categories = [
        ['x-powers', 'X', xAggregated],
        ['league-powers', 'League', leagueAggregated],
    ] as Array<[string, string, ReturnType<typeof aggregateRule>]>;

    return `
    <div id="data">
        <div id="name">${name}</div>
        <div id="weapons">
        ${findFavoriteWeapons(weaponUsage).map(([id]) => `<div class="weapon"><img src="${getWeaponImageUrl(id)}"></div>`).join('')}
        </div>
    </div>
    <div id="powers">
        ${categories.map(([id, heading, category]) => `
        <div id="${id}">
            <div class="heading ${heading.toLowerCase()}">${heading}</div>
            <table>
            ${ruleIds.map((rule) => `
                <tr>
                    <td class="rule-name shadowed" style="background-color: ${ruleColors[rule]};">${ruleNames[rule]}</td>
                    <td class="shadowed">${category.highestOfRules[rule].rank ? `#${category.highestOfRules[rule].rank}` : '-'}</td>
                    <td class="shadowed">${category.highestOfRules[rule].rating ?? '-'}</td>
                </tr>
                `)
            .join('')}
            </table>
        </div>
        `).join('')}
    </div>
    `;
}
