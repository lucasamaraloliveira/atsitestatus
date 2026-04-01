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
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

    // ESTRATÉGIA: Monitoramento Server-Side (Tipo Postman/Insomnia)
    // Agora usamos uma API interna no Backend para evitar as limitações do navegador.
    try {
        const response = await fetch('/api/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: cleanUrl, keyword })
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            return {
                status: CheckStatus.ONLINE,
                message: data.message || "Online",
                latency: data.latency || 0
            };
        } else {
            return {
                status: CheckStatus.OFFLINE,
                message: data.message || "Offline: Falha na verificação.",
                latency: data.latency || 0
            };
        }

    } catch (error: any) {
        // Fallback robusto caso a API interna falhe (Ex: Problemas no servidor local)
        console.warn("Aviso: Falha na API interna, recorrendo a verificação direta...");
        try {
            const pingStart = performance.now();
            const pCtrl = new AbortController();
            const pTid = setTimeout(() => pCtrl.abort(), 5000);

            await fetch(cleanUrl, { mode: 'no-cors', cache: 'no-cache', signal: pCtrl.signal });
            clearTimeout(pTid);

            return {
                status: CheckStatus.ONLINE,
                message: "Online (Modo Reserva)",
                latency: Math.round(performance.now() - pingStart)
            };
        } catch (e) {
            return {
                status: CheckStatus.OFFLINE,
                message: "Site Indisponível (Erro Crítico)",
                latency: 0
            };
        }
    }
};

export const performDeepAiAnalysis = async (url: string, htmlContent: string): Promise<string> => {
    try {
        const prompt = `Analise o status deste site: ${url}. Parece fora do ar? Conteúdo: ${htmlContent.substring(0, 500)}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "IA indisponível.";
    }
};
