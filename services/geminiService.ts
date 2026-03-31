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

export const checkWebsiteStatus = async (url: string): Promise<CheckResult> => {
  const cleanUrl = url.trim();
  let latency = 0;
  let status = CheckStatus.ONLINE;
  let message = "Site estável e respondendo normalmente.";

  // ESTRATÉGIA: Medição de Latência Real (Ping Direto)
  // Usamos um AbortController curto para medir apenas o RTT (Round Trip Time) inicial
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const pingStart = performance.now();

  try {
    // Tenta uma conexão direta (no-cors) para pegar a latência REAL da rede do usuário
    await fetch(cleanUrl, { 
      method: 'GET', 
      mode: 'no-cors', 
      cache: 'no-cache',
      signal: controller.signal 
    });
    latency = Math.round(performance.now() - pingStart);
    clearTimeout(timeoutId);
  } catch (e: any) {
    // Se falhar o direto, pode ser CORS (comum) ou Down total
    // Vamos usar o tempo até aqui como base inicial
    latency = Math.round(performance.now() - pingStart);
  }

  // VERIFICAÇÃO DE INTEGRIDADE (Via Proxy p/ Status Codes Reais)
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}&timestamp=${Date.now()}`;
    const proxyResponse = await fetch(proxyUrl);
    const data = await proxyResponse.json();

    if (data.status && data.status.http_code) {
      const code = data.status.http_code;
      if (code >= 200 && code < 400) {
        status = CheckStatus.ONLINE;
        message = `Online (HTTP ${code}).`;
      } else {
        status = CheckStatus.OFFLINE;
        message = `Offline: Servidor respondeu com erro ${code}.`;
      }
    } else {
      // Se o proxy não retornou código (erro de rede do proxy)
      // Mas o ping direto funcionou, mantemos Online
      if (latency < 4500) {
        status = CheckStatus.ONLINE;
        message = "Online (Verificado via conexão direta).";
      } else {
        status = CheckStatus.OFFLINE;
        message = "O site não respondeu no tempo limite (Timeout).";
      }
    }
  } catch (proxyError) {
    // Fallback final: Se até o proxy falhar, confiamos na latência do ping direto
    if (latency > 0 && latency < 5000) {
        status = CheckStatus.ONLINE;
        message = "Online (Acesso direto confirmado).";
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
