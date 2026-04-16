import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db/pool';

export const aiRouter = Router();
aiRouter.use(requireAuth);

const AI_BASE_URL = process.env.AXTEL_AI_URL || 'https://axiaproxy-dnajdmfmftbqdued.eastus2-01.azurewebsites.net';
const AI_API_KEY = process.env.AXTEL_AI_KEY || '';
const AI_MODEL = process.env.AXTEL_AI_MODEL || 'claude-sonnet-4-6';

// ── Obtener datos del portal segun permisos del usuario ───────────────────────
async function getContextForUser(userId: string, role: string) {
  const isLider = role === 'lider';
  const params: any[] = [];
  let projectFilter = '';

  if (isLider) {
    params.push(userId);
    projectFilter = ` AND p.created_by = $${params.length}`;
  }

  const projects = await pool.query(`
    SELECT p.name, p.scrum_stage, p.progress, p.classification,
      p.planned_go_live_date, p.go_live_date,
      pa.name AS responsible_name, rq.name AS requestor_name,
      po.name AS portfolio_name
    FROM projects p
    LEFT JOIN participants pa ON pa.id = p.responsible_id
    LEFT JOIN requestors rq ON rq.id = p.requestor_id
    LEFT JOIN portfolios po ON po.id = p.portfolio_id
    WHERE p.deleted_at IS NULL${projectFilter}
    ORDER BY p.name
  `, params);

  let budget: any[] = [];
  if (['admin', 'director', 'gerente', 'lider'].includes(role)) {
    try {
      const budgetQuery = await pool.query(`
        SELECT s.name AS structure_name,
          SUM(b.authorized) AS authorized,
          SUM(b.exercised) AS exercised,
          SUM(b.authorized - b.exercised) AS available
        FROM budgets b
        LEFT JOIN structures s ON s.id = b.structure_id
        GROUP BY s.name
      `);
      budget = budgetQuery.rows;
    } catch {
    }
  }

  return { projects: projects.rows, budget };
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
aiRouter.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensaje requerido' });

  if (!AI_API_KEY) {
    return res.status(500).json({ error: 'Asistente de IA no configurado. Contacta al administrador.' });
  }

  try {
    const context = await getContextForUser(req.user!.id, req.user!.role);

    const projectLines = context.projects.map((p: any) => {
      const delay = p.go_live_date && p.planned_go_live_date
        ? Math.round((new Date(p.go_live_date).getTime() - new Date(p.planned_go_live_date).getTime()) / 86400000)
        : 0;
      return `${p.name}|${p.portfolio_name||''}|${p.scrum_stage}|${p.progress}%|${p.classification}|${p.responsible_name||'-'}|${p.requestor_name||'-'}|GL:${p.planned_go_live_date||'-'}|Real:${p.go_live_date||'-'}${delay>0?`|RETRASO:${delay}d`:''}`;
    }).join('\n');

    const budgetLines = context.budget.map((b: any) =>
      `${b.structure_name}|Aut:$${Number(b.authorized||0).toLocaleString()}|Ej:$${Number(b.exercised||0).toLocaleString()}|Disp:$${Number(b.available||0).toLocaleString()}`
    ).join('\n');

    const systemContent = `Eres el asistente del PMO Portal de AXTEL. Responde en espanol, conciso.
Usuario: ${req.user!.name} (${req.user!.role}).

PROYECTOS (nombre|portafolio|etapa|avance|tipo|lider|solicitante|go-live|real):
${projectLines || 'Sin proyectos'}

${budgetLines ? `PRESUPUESTO:\n${budgetLines}` : ''}

Reglas: solo usa datos del contexto. No inventes. Se conciso.`;

    // Para Claude via proxy, enviar contexto como primer mensaje de usuario
    // ya que algunos proxies no soportan el role "system"
    const messages = [
      { role: 'user', content: `[INSTRUCCIONES DEL SISTEMA]\n${systemContent}\n[FIN INSTRUCCIONES]\n\nResponde "Entendido" para confirmar.` },
      { role: 'assistant', content: 'Entendido. Soy el asistente del PMO Portal. Tengo los datos de los proyectos cargados. ¿En que puedo ayudarte?' },
      ...history.slice(-6).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const requestBody = {
      model: AI_MODEL,
      messages,
      max_tokens: 1000,
    };

    console.log('AI request:', JSON.stringify({ model: AI_MODEL, messageCount: messages.length, promptLength: JSON.stringify(requestBody).length }));

    const aiResponse = await fetch(`${AI_BASE_URL}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await aiResponse.text();
    console.log('AI response status:', aiResponse.status, 'body length:', responseText.length);

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('AI response not JSON:', responseText.substring(0, 500));
      return res.status(502).json({ error: 'Respuesta invalida del servicio de IA.' });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (reply && reply.trim()) {
      return res.json({ reply, model: AI_MODEL });
    }

    console.error('Axtel AI empty response:', aiResponse.status, responseText.substring(0, 500));
    return res.status(502).json({ error: 'El modelo no genero respuesta. Intenta de nuevo.' });

  } catch (err: any) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Error interno del asistente de IA.' });
  }
});
