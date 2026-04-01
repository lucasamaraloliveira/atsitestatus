import { CheckStatus } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa o Gemini para análise profunda de disponibilidade
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface CheckResult {
  status: CheckStatus;
  message: string;
  latency: number;
}

export const checkWebsiteStatus = async (url: string, keyword?: string): Promise<CheckResult> => {
  const cleanUrl = url.trim();
  let latency = 0;
  let status = CheckStatus.ONLINE;
  let message = "Site estável e respondendo normalmente.";

  // ESTRATÉGIA: Medição de Latência Real (Ping Direto)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const pingStart = performance.now();

  try {
    await fetch(cleanUrl, { 
      method: 'GET', 
      mode: 'no-cors', 
      cache: 'no-cache',
      signal: controller.signal 
    });
    latency = Math.round(performance.now() - pingStart);
    clearTimeout(timeoutId);
  } catch (e: any) {
    latency = Math.round(performance.now() - pingStart);
  }

  // VERIFICAÇÃO DE INTEGRIDADE (Via Proxy p/ Status Codes e Conteúdo)
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}&timestamp=${Date.now()}`;
    const proxyResponse = await fetch(proxyUrl);
    const data = await proxyResponse.json();

    if (data.status && data.status.http_code) {
      const code = data.status.http_code;
      const htmlContent = data.contents || "";
      
      if (code >= 200 && code < 400) {
        // Se houver palavra-chave, validamos o conteúdo
        if (keyword && !htmlContent.toLowerCase().includes(keyword.toLowerCase())) {
          status = CheckStatus.ERROR;
          message = `Erro: Palavra-chave "${keyword}" não encontrada no conteúdo.`;
        } else {
          status = CheckStatus.ONLINE;
          message = `Online (HTTP ${code}).`;
        }
      } else {
        status = CheckStatus.OFFLINE;
        message = `Offline: Servidor respondeu com erro ${code}.`;
      }
    } else {
      if (latency < 4500) {
        status = CheckStatus.ONLINE;
        message = "Online (Direto).";
      } else {
        status = CheckStatus.OFFLINE;
        message = "O site não respondeu (Timeout).";
      }
    }
  } catch (proxyError) {
    if (latency > 0 && latency < 5000) {
        status = CheckStatus.ONLINE;
        message = "Online (Direto).";
    } else {
        status = CheckStatus.OFFLINE;
        message = "Falha crítica de comunicação.";
    }
  }

  return { status, message, latency: Math.min(latency, 10000) };
};

export const performDeepAiAnalysis = async (url: string, htmlContent: string): Promise<string> => {
    try {
        const prompt = `Analise a disponibilidade deste site. Ele parece uma página de erro, uma página de "em construção" ou um domínio estacionado? Responda com uma breve descrição. Site: ${url}\nConteúdo: ${htmlContent.substring(0, 500)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "Análise de IA indisponível.";
    }
};
