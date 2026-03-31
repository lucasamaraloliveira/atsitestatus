import { CheckStatus } from "@/types";

interface CheckResult {
  status: CheckStatus;
  message: string;
  latency: number;
}

export const checkWebsiteStatus = async (url: string): Promise<CheckResult> => {
  const startTime = performance.now();
  try {
    // Usamos o modo 'no-cors' para verificar a acessibilidade sem problemas de CORS.
    // A resposta será "opaca", mas uma requisição bem-sucedida indica que o servidor está ativo.
    // Um erro de rede (no bloco catch) indica que está inativo.
    await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-cache' });
    const endTime = performance.now();
    return {
      status: CheckStatus.ONLINE,
      message: "O site respondeu ao ping (está acessível).",
      latency: Math.round(endTime - startTime)
    };
  } catch (error) {
    const endTime = performance.now();
    // O bloco catch é acionado por erros de rede (DNS, servidor offline, etc.)
    console.warn(`Ping para ${url} falhou:`, error);
    return {
      status: CheckStatus.OFFLINE,
      message: "O site não respondeu ao ping (pode estar offline).",
      latency: Math.round(endTime - startTime)
    };
  }
};
