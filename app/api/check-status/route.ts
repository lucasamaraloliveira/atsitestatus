import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        const { url, keyword } = await request.json();

        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

        const host = new URL(cleanUrl).hostname;
        const startTime = Date.now();

        // 1. VERIFICAÇÃO DE SSL (Server-Side)
        const checkSSL = () => {
            return new Promise<{ expiryDate: number | null, daysRemaining: number | null }>((resolve) => {
                try {
                    const options = {
                        hostname: host,
                        port: 443,
                        method: 'GET',
                        rejectUnauthorized: false, // Permite ler certificados mesmo que estejam expirados ou inválidos para diagnóstico
                        agent: false
                    };

                    const req = https.request(options, (res) => {
                        const cert = (res.socket as any).getPeerCertificate();
                        if (cert && cert.valid_to) {
                            const expiryDate = new Date(cert.valid_to).getTime();
                            const daysRemaining = Math.max(0, Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24)));
                            resolve({ expiryDate, daysRemaining });
                        } else {
                            resolve({ expiryDate: null, daysRemaining: null });
                        }
                    });

                    req.on('error', () => resolve({ expiryDate: null, daysRemaining: null }));
                    req.setTimeout(5000, () => {
                        req.destroy();
                        resolve({ expiryDate: null, daysRemaining: null });
                    });
                    req.end();
                } catch (e) {
                    resolve({ expiryDate: null, daysRemaining: null });
                }
            });
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            // 2. VERIFICAÇÃO DE STATUS E CONTEÚDO (Tipo Postman/Insomnia)
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
            });

            const latency = Date.now() - startTime;
            const status = response.status;
            const htmlContent = await response.text();
            clearTimeout(timeoutId);

            // Inicia o check de SSL em paralelo (se for https)
            const sslResult = cleanUrl.startsWith('https') ? await checkSSL() : { expiryDate: null, daysRemaining: null };

            // Verificação de Erro HTTP
            if (status >= 400) {
                return NextResponse.json({
                    ok: false,
                    status,
                    message: `Offline: Servidor retornou erro ${status}`,
                    latency,
                    ssl: sslResult
                });
            }

            // Verificação de Palavra-Chave
            if (keyword && !htmlContent.toLowerCase().includes(keyword.toLowerCase())) {
                return NextResponse.json({
                    ok: false,
                    status,
                    message: `Alerta: Palavra-chave "${keyword}" não encontrada.`,
                    latency,
                    ssl: sslResult
                });
            }

            return NextResponse.json({
                ok: true,
                status,
                message: `Online (HTTP ${status})`,
                latency,
                ssl: sslResult
            });

        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            const sslResult = cleanUrl.startsWith('https') ? await checkSSL() : { expiryDate: null, daysRemaining: null };
            return NextResponse.json({
                ok: false,
                status: 0,
                message: fetchError.name === 'AbortError' ? 'Offline: Tempo de resposta esgotado (Timeout)' : 'Offline: Erro de DNS ou Conexão',
                latency: Date.now() - startTime,
                ssl: sslResult
            });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
