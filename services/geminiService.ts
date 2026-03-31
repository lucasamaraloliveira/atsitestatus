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

const ERROR_KEYWORDS = ["404 Not Found", "503 Service Unavailable", "Database Error", "Erro ao estabelecer conexão", "Account Suspended"];

export const checkWebsiteStatus = async (url: string): Promise<CheckResult> => {
  const startTime = performance.now();
  
  const performFetch = async (useProxy = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch(url, { 
        method: 'GET', 
        mode: 'no-cors', // Mantido para evitar bloqueios de CORS no cliente
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ATSiteStatus/2.0 (Monitoramento de Disponibilidade)'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  };

  try {
    // Primeira tentativa
    await performFetch();
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // Como estamos em 'no-cors', não conseguimos ler o body diretamente.
    // Para uma verificação "Ampla", tentamos detectar se a resposta é opaca (site vivo)
    return {
      status: CheckStatus.ONLINE,
      message: "Site acessível e respondendo (CORS Opaque).",
      latency
    };
  } catch (error: any) {
    // Segunda tentativa em caso de falha (evita falso-positivo)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await performFetch();
      const endTime = performance.now();
      return {
        status: CheckStatus.ONLINE,
        message: "Estabilizado após segunda tentativa.",
        latency: Math.round(endTime - startTime)
      };
    } catch (secondError: any) {
      const endTime = performance.now();
      let message = "O site não respondeu após múltiplas tentativas.";
      
      if (error.name === 'AbortError') message = "O site demorou demais para responder (Timeout).";
      
      return {
        status: CheckStatus.OFFLINE,
        message,
        latency: Math.round(endTime - startTime)
      };
    }
  }
};

/**
 * Função opcional para uso via Proxy/Backend (se houver) que permite verificação profunda
 */
export const performDeepAiAnalysis = async (url: string, htmlContent: string): Promise<string> => {
    try {
        const prompt = `Analise a disponibilidade deste site. Ele parece uma página de erro, uma página de "em construção" ou um domínio estacionado? Responda com uma breve descrição. Site: ${url}\nConteúdo: ${htmlContent.substring(0, 500)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "Análise de IA indisponível.";
    }
};
