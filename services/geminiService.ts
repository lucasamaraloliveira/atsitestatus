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
  
  const cleanUrl = url.trim();
  
  try {
    // TENTATIVA 1: Fetch direto (Rápido, mas cego para status codes devido ao no-cors)
    const directResponse = await fetch(cleanUrl, { 
      method: 'GET', 
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'User-Agent': 'ATSiteStatus/2.0' }
    });
    
    // Se chegou aqui sem erro, o site existe e serviu algo. 
    // Porém, para ser ROBUSTO, vamos confirmar se não é um erro 404/500 mascarado.
    
    // TENTATIVA 2: Verificação profunda via Proxy (Permite ver o STATUS REAL)
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
      const proxyResponse = await fetch(proxyUrl);
      const data = await proxyResponse.json();
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (data.status && data.status.http_code) {
        const code = data.status.http_code;
        
        if (code >= 200 && code < 400) {
          return { status: CheckStatus.ONLINE, message: "Site estável e respondendo normalmente.", latency };
        } else {
          return { 
            status: CheckStatus.OFFLINE, 
            message: `Erro detectado: Servidor respondeu com Status ${code}.`, 
            latency 
          };
        }
      }
    } catch (proxyError) {
      // Se o proxy falhar (ex: bloqueio de IP ou timeout), confiamos na resposta direta do passo 1
      const endTime = performance.now();
      return { status: CheckStatus.ONLINE, message: "Site acessível (Verificado via conexão direta).", latency: Math.round(endTime - startTime) };
    }

    return { status: CheckStatus.ONLINE, message: "Online", latency: 0 }; // Fallback

  } catch (error: any) {
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    // TENTATIVA FINAL: Se o fetch direto falhou (CORS ou DNS), o Proxy pode confirmar se está de fato offline
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
      const proxyResponse = await fetch(proxyUrl);
      const data = await proxyResponse.json();
      
      if (data.status && data.status.http_code) {
         const code = data.status.http_code;
         if (code >= 200 && code < 400) {
            return { status: CheckStatus.ONLINE, message: "Online via Relay (Recuperado de falha local).", latency };
         }
      }
    } catch (e) {}

    return { 
      status: CheckStatus.OFFLINE, 
      message: "Falha crítica de conexão. O site parece estar fora do ar ou o domínio é inexistente.", 
      latency 
    };
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
