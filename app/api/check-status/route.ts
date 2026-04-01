import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        const { url, keyword } = await request.json();

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const startTime = Date.now();

        try {
            // COMPORTAMENTO TIPO POSTMAN/INSOMNIA (Server-to-Server)
            const response = await fetch(cleanUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ATSiteStatus/1.0 (Monitoring Bot)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                signal: controller.signal,
                redirect: 'follow',
                // Força o erro se houver problemas de SSL
            });

            const latency = Date.now() - startTime;
            const status = response.status;
            const htmlContent = await response.text();
            clearTimeout(timeoutId);

            // Verificação de Erro HTTP
            if (status >= 400) {
                return NextResponse.json({
                    ok: false,
                    status,
                    message: `Offline: Servidor retornou erro ${status}`,
                    latency
                });
            }

            // Verificação de Palavra-Chave
            if (keyword && !htmlContent.toLowerCase().includes(keyword.toLowerCase())) {
                return NextResponse.json({
                    ok: false,
                    status,
                    message: `Alerta: Palavra-chave "${keyword}" não encontrada.`,
                    latency
                });
            }

            return NextResponse.json({
                ok: true,
                status,
                message: `Online (HTTP ${status})`,
                latency
            });

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            return NextResponse.json({
                ok: false,
                status: 0,
                message: fetchError.name === 'AbortError' ? 'Offline: Tempo de resposta esgotado (Timeout)' : 'Offline: Erro de DNS ou Conexão',
                latency: Date.now() - startTime
            });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
