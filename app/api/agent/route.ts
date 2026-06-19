import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are Ask Supervisd, a BACB compliance assistant for ABA professionals. Answer questions about fieldwork hours, supervision requirements, and certification. Be concise and cite BACB requirements when relevant.

Key rules:
- BCBA fieldwork: 2,000 unrestricted or 1,500 concentrated hours
- Supervision: minimum 5% of hours per month
- Restricted hours: max 50% of total
- Individual supervision counts more than group`;

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
    const statusRes = await fetch(`${apiUrl}/billing/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!statusRes.ok) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
    }
    const { subscription_status } = await statusRes.json();
    if (subscription_status !== 'active') {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
    }

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