import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are Ask Accrue, a BACB compliance assistant for ABA professionals. Answer questions about fieldwork hours, supervision requirements, and certification. Be concise and cite BACB requirements when relevant.

Key rules:
- BCBA fieldwork: 2,000 unrestricted or 1,500 concentrated hours
- Supervision: minimum 5% of hours per month
- Restricted hours: max 50% of total
- Individual supervision counts more than group`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [...(history || []), { role: 'user', content: message }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ message: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
