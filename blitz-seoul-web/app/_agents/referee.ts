// import { createAgent } from "langchain";
// import * as z from "zod";
// import "dotenv/config";

// import { ChatOpenAI } from "@langchain/openai";

// const BattleResult = z.object({
//   winner: z
//     .string()
//     .describe("This is the name of the winner of the two characters' battle"),
//   scenario: z
//     .string()
//     .max(150)
//     .describe("This is the battle scenario of the two characters."),
// });

// const model = new ChatOpenAI({
//   model: "gpt-4o-mini",
//   temperature: 0.1,
// });

// const agent = createAgent({
//   model,
//   responseFormat: BattleResult,
//   systemPrompt: `당신은 두 캐릭터의 설명만을 근거로 승자를 결정하는 전투 판정 전문가입니다.

//     규칙:
//     - 반드시 한 명의 승자만 선택합니다.
//     - 승자 이름은 입력으로 주어진 캐릭터 이름과 **정확히 일치**해야 합니다(별칭/추가 수식어 금지).
//     - 외부 설정/지식을 추가하지 않습니다(세계관·아이템·지형·조력자 임의 확장 금지).
//     - 동일 조건의 1대1 전투를 가정합니다.
//     - 판단은 설명을 기반으로 진행합니다.
//     - 애매할 경우에도 반드시 1명을 고릅니다(동률 금지).
//     - 캐릭터의 입력 순서가 해당 전투에 영향을 미쳐서는 안됩니다.

//     출력(중요):
//     - 출력은 오직 구조화 스키마 BattleResult의 두 필드만 채웁니다. **추가 텍스트/머리말/마크다운 금지**.
//       - winner: 승자 캐릭터의 **정확한 이름** (입력과 동일한 철자)
//       - scenario: 한국어로 150자 전투 묘사(결정적 교환과 승부 요인을 간결히 표현). 과도한 잔혹/외설 금지.`,
// });

// export async function referee(
//   nameA: string,
//   descA: string,
//   nameB: string,
//   descB: string
// ) {
//   const result = await agent.invoke({
//     messages: [
//       {
//         role: "user",
//         content: `
//   [캐릭터 A]
//   이름:${nameA}
//   설명:${descA}

//   [캐릭터 B]
//   이름:${nameB}
//   설명:${descB}

//   --- 요청 ---
//   결투의 승자를 결정하고, 150자 정도의 전투 시나리오를 작성해줘.`,
//       },
//     ],
//   });

//   return {
//     winner: result.structuredResponse.winner,
//     scenario: result.structuredResponse.scenario,
//   };
// }

// lib/referee.ts
import { createAgent } from "langchain";
import * as z from "zod";
import { ChatOpenAI } from "@langchain/openai";

const BattleResult = z.object({
  winner: z
    .string()
    .describe("This is the name of the winner of the two characters' battle"),
  scenario: z
    .string()
    .max(150)
    .describe("This is the battle scenario of the two characters."),
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.1,
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const agent = createAgent({
  model,
  responseFormat: BattleResult,
  systemPrompt: `당신은 두 캐릭터의 설명만을 근거로 승자를 결정하는 전투 판정 전문가입니다.

    규칙:
    - 반드시 한 명의 승자만 선택합니다.
    - 승자 이름은 입력으로 주어진 캐릭터 이름과 **정확히 일치**해야 합니다(별칭/추가 수식어 금지).
    - 외부 설정/지식을 추가하지 않습니다(세계관·아이템·지형·조력자 임의 확장 금지).
    - 동일 조건의 1대1 전투를 가정합니다.
    - 판단은 설명을 기반으로 진행합니다.
    - 애매할 경우에도 반드시 1명을 고릅니다(동률 금지).
    - 캐릭터의 입력 순서가 해당 전투에 영향을 미쳐서는 안됩니다.

    출력(중요):
    - 출력은 오직 구조화 스키마 BattleResult의 두 필드만 채웁니다. **추가 텍스트/머리말/마크다운 금지**.
      - winner: 승자 캐릭터의 **정확한 이름** (입력과 동일한 철자)
      - scenario: 한국어로 150자 전투 묘사(결정적 교환과 승부 요인을 간결히 표현). 과도한 잔혹/외설 금지.`,
});

export async function referee(
  nameA: string,
  descA: string,
  nameB: string,
  descB: string
) {
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `
[캐릭터 A]
이름:${nameA}
설명:${descA}

[캐릭터 B]
이름:${nameB}
설명:${descB}

--- 요청 ---
결투의 승자를 결정하고, 150자 정도의 전투 시나리오를 작성해줘.`,
      },
    ],
  });

  return {
    winner: result.structuredResponse.winner,
    scenario: result.structuredResponse.scenario,
  };
}
