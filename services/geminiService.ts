import { GoogleGenAI } from "@google/genai";
import { FeedingRecord } from "../types";

// Initialize the Gemini client
// We assume process.env.API_KEY is available as per instructions.
// If not, this will throw an error when called, handled by the UI.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFeedingData = async (
  dateStr: string,
  records: FeedingRecord[]
): Promise<string> => {
  if (!apiKey) {
    return "请配置 API Key 以使用智能分析功能。";
  }

  if (records.length === 0) {
    return "今日暂无喂养记录。";
  }

  const prompt = `
    你是一个专业的育儿助手。请根据以下宝宝今天的喂养记录进行分析。
    日期: ${dateStr}
    
    记录数据 (JSON):
    ${JSON.stringify(records.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString(),
      type: r.type === 'breast_milk' ? '母乳' : '配方奶',
      amount: r.amount + 'ml'
    })))}

    请提供一个简短的总结（中文），包括：
    1. 总奶量统计（母乳和配方奶分开统计以及总和）。
    2. 喂养频率分析。
    3. 给父母的一句温馨鼓励或基于数据的科学建议（注意：不要提供医疗处方，只提供一般性护理建议）。
    请保持语气温柔、支持性强。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful and warm parenting assistant.",
      }
    });

    return response.text || "无法生成分析，请稍后再试。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "智能分析服务暂时不可用，请检查网络或 API Key 设置。";
  }
};
