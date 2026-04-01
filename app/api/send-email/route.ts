import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, subject, siteName, url, status, message, latency, timestamp } = await req.json();

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
        console.error('WEB3FORMS_ACCESS_KEY não configurada no .env.local');
        return NextResponse.json({ error: 'Configuração de e-mail pendente' }, { status: 500 });
    }

    if (!to || !siteName || !status) {
        return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    const isOnline = status === 'online';
    const color = isOnline ? '#34C759' : '#FF3B30';
    const accentColor = '#0071E3';

    // Template HTML customizado (estilo Apple)
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F5F7; padding: 40px; color: #1D1D1F;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, ${accentColor}, #5AC8FA); padding: 40px; text-align: center; color: #FFFFFF;">
                <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px;">AT</div>
                <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; opacity: 0.8;">SiteStatus Monitor</div>
            </div>
            
            <div style="padding: 48px;">
              <div style="margin-bottom: 32px; text-align: center;">
                <span style="display: inline-block; padding: 8px 16px; border-radius: 100px; background-color: ${color}15; color: ${color}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                    Estado: ${status.toUpperCase()}
                </span>
                <h1 style="font-size: 24px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; letter-spacing: -0.5px;">
                    O status do seu site mudou
                </h1>
                <p style="color: #86868B; font-size: 16px;">Detectamos uma alteração no monitoramento da sua conta.</p>
              </div>

              <div style="background-color: #F5F5F7; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #86868B; font-size: 13px;">Site:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${siteName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #86868B; font-size: 13px;">Endereço:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px; color: ${accentColor};">${url}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #86868B; font-size: 13px;">Mensagem:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${message}</td>
                  </tr>
                  ${latency ? `
                  <tr>
                    <td style="padding: 8px 0; color: #86868B; font-size: 13px;">Latência:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${latency}ms</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #86868B; font-size: 13px;">Horário:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${timestamp}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center;">
                <a href="${url}" style="display: inline-block; background-color: #1D1D1F; color: #FFFFFF; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 600; font-size: 15px; transition: transform 0.2s;">
                  Verificar Site Agora
                </a>
              </div>
            </div>

            <div style="background-color: #F5F5F7; padding: 32px; text-align: center; font-size: 12px; color: #86868B; border-top: 1px solid #E5E5E7;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} ATSiteStatus. All rights reserved.</p>
              <p style="margin-top: 8px; opacity: 0.6;">Você recebeu este e-mail porque ativou as notificações de monitoramento.</p>
            </div>
          </div>
        </div>
    `;

    // Enviar para o Web3Forms - Configurado como Alerta de Sistema
    const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            access_key: accessKey,
            subject: `[ALERTA STATUS] ${siteName} está ${status.toUpperCase()}`,
            from_name: "ATSiteStatus Alertas",
            to_email: to,
            replyto: "no-reply@atsitestatus.com",
            message: `Alerta: ${siteName} está ${status}.`,
            html: htmlContent,
            botcheck: false,
            redirect: ""
        })
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        if (result.success) {
            return NextResponse.json({ success: true, message: 'Email enviado' });
        } else {
            console.error('Erro Web3Forms:', result);
            return NextResponse.json({ error: result.message || 'Erro no envio' }, { status: 400 });
        }
    } else {
        const text = await response.text();
        console.error('Resposta não-JSON do Web3Forms:', text);
        return NextResponse.json({ error: 'O serviço de e-mail retornou um erro inesperado' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro na rota de e-mail:', error);
    return NextResponse.json({ error: 'Erro interno ao disparar e-mail' }, { status: 500 });
  }
}
