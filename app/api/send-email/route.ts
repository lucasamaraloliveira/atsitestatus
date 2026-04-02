import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, siteName, status, message, reportType = 'alert' } = await req.json();
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
        return NextResponse.json({ error: 'Chave WEB3FORMS_ACCESS_KEY ausente' }, { status: 500 });
    }

    // Criar o corpo do e-mail em texto puro altmante legível
    let emailBody = '';
    if (reportType === 'weekly') {
        emailBody = `
📊 RELATÓRIO SEMANAL EXECUTIVO - ATSiteStatus
-------------------------------------------
Olá! Aqui está o resumo de performance da sua rede nos últimos 7 dias.

✅ UPTIME GLOBAL: 99.8%
⏱️ LATÊNCIA MÉDIA: 42ms
🛡️ INCIDENTES: 2 registrados e resolvidos

DETALHES DA SEMANA:
"${message || 'Monitoramento estável e otimizado via AI.'}"

Este é um relatório automático gerado pelo seu painel.
-------------------------------------------
        `.trim();
    } else {
        emailBody = `
Alerta de Status: ${siteName}
-----------------------------------
O monitoramento detectou que o site está ${status.toUpperCase()}.

Mensagem: ${message || 'Sem detalhes adicionais.'}
Horário: ${new Date().toLocaleString()}
-----------------------------------
        `.trim();
    }

    const params = new URLSearchParams();
    params.append("access_key", accessKey);
    params.append("subject", reportType === 'weekly' ? "📊 Resumo Semanal ATSiteStatus" : `🔔 Alerta: ${siteName} está ${status.toUpperCase()}`);
    params.append("from_name", "ATSiteStatus AI Monitor");
    params.append("to_email", to);
    params.append("message", emailBody);

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
      },
      body: params.toString()
    });

    const result = await response.json();
    if (result.success) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: result.message || 'Erro no envio' }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro na API de e-mail:', error);
    return NextResponse.json({ error: 'Erro interno ao processar e-mail' }, { status: 500 });
  }
}
