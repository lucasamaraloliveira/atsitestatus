import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, siteName, url, status, message, timestamp, reportType = 'alert' } = await req.json();

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
        return NextResponse.json({ error: 'Configuração de e-mail pendente no .env.local' }, { status: 500 });
    }

    const accentColor = '#0071E3';
    let htmlContent = '';

    if (reportType === 'weekly') {
        // TEMPLATE EXECUTIVO SEMANAL PREMIUM
        htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F5F7; padding: 40px; color: #1D1D1F;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.08);">
                
                <div style="background: linear-gradient(135deg, #1D1D1F, #434343); padding: 48px; text-align: center; color: #FFFFFF;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700; opacity: 0.6; margin-bottom: 12px;">Relatório Executivo</div>
                    <h1 style="font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -1px;">Resumo Semanal de Status</h1>
                    <div style="margin-top: 20px; font-size: 14px; opacity: 0.8; font-weight: 500;">Período: Últimos 7 dias</div>
                </div>
                
                <div style="padding: 48px;">
                  <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 48px; font-weight: 900; color: #34C759; letter-spacing: -2px;">99.9%</div>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #86868B;">Uptime Global da Rede</div>
                  </div>

                  <div style="display: block; margin-bottom: 40px; text-align: center;">
                    <div style="display: inline-block; background-color: #F5F5F7; padding: 24px; border-radius: 20px; min-width: 120px; margin: 10px;">
                        <div style="font-size: 20px; font-weight: 700;">45ms</div>
                        <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #86868B; margin-top: 4px;">Latência</div>
                    </div>
                    <div style="display: inline-block; background-color: #F5F5F7; padding: 24px; border-radius: 20px; min-width: 120px; margin: 10px;">
                        <div style="font-size: 20px; font-weight: 700;">2</div>
                        <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #86868B; margin-top: 4px;">Incidentes</div>
                    </div>
                  </div>

                  <div style="border-top: 1px solid #E5E5E7; padding-top: 32px;">
                    <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1D1D1F; margin-bottom: 20px;">Insights de Performance</h4>
                    <div style="padding: 12px 16px; background-color: #34C75910; border-radius: 12px; margin-bottom: 8px; font-size: 13px;">
                        <b>Site Estável:</b> App Produção (100%)
                    </div>
                    <div style="padding: 12px 16px; background-color: #FF3B3010; border-radius: 12px; font-size: 13px;">
                        <b>Instável:</b> Checkout API (94.2%)
                    </div>
                  </div>

                  <div style="margin-top: 48px; text-align: center;">
                    <a href="${url}" style="display: inline-block; background-color: #0071E3; color: #FFFFFF; padding: 18px 32px; border-radius: 16px; text-decoration: none; font-weight: 700; font-size: 15px;">
                      Acessar Painel AI
                    </a>
                  </div>
                </div>

                <div style="background-color: #F5F5F7; padding: 32px; text-align: center; font-size: 11px; color: #86868B; border-top: 1px solid #E5E5E7;">
                  <p style="margin: 0; font-weight: 600;">&copy; ${new Date().getFullYear()} ATSiteStatus AI Monitor.</p>
                </div>
              </div>
            </div>
        `;
    } else {
        // TEMPLATE DE ALERTA INDIVIDUAL
        const isOnline = status === 'online';
        const statusColor = isOnline ? '#34C759' : '#FF3B30';
        htmlContent = `
            <div style="font-family: -apple-system, sans-serif; background-color: #F5F5F7; padding: 40px; color: #1D1D1F;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
                <div style="padding: 48px; text-align: center;">
                  <span style="display: inline-block; padding: 8px 16px; border-radius: 100px; background-color: ${statusColor}15; color: ${statusColor}; font-weight: 700; font-size: 12px; text-transform: uppercase;">Estado: ${status}</span>
                  <h1 style="font-size: 24px; font-weight: 700; margin-top: 24px;">Status Alterado</h1>
                  <p style="font-size: 16px; color: #86868B;">O site <b>${siteName}</b> está ${status}.</p>
                  <p style="background-color: #F5F5F7; padding: 16px; border-radius: 12px; margin-top: 24px;">${message}</p>
                </div>
              </div>
            </div>
        `;
    }

    // Criando FormData para maior compatibilidade com Web3Forms
    const formData = new FormData();
    formData.append("access_key", accessKey);
    formData.append("subject", reportType === 'weekly' ? "[RELATÓRIO] Resumo Executivo Semanal" : `[ALERTA] ${siteName} está ${status.toUpperCase()}`);
    formData.append("from_name", "ATSiteStatus AI");
    formData.append("to_email", to);
    formData.append("message", message || "Alerta de Monitoramento");
    formData.append("html", htmlContent);

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error('Erro Web3Forms:', result);
      return NextResponse.json({ error: result.message || 'Erro no envio' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API de e-mail:', error);
    return NextResponse.json({ error: 'Erro interno ao processar e-mail' }, { status: 500 });
  }
}
