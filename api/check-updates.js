// Vercel serverless function. Runs server-side only — the API key here is
// never sent to the browser. Requires an ANTHROPIC_API_KEY environment
// variable set in your Vercel project settings (see README.md).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const { players } = req.body || {};
    if (!Array.isArray(players) || players.length === 0) {
      res.status(400).json({ error: 'Expected a non-empty "players" array in the request body.' });
      return;
    }

    const nameBlock = players.map((p) => `${p.name} (${p.pos}, ${p.team})`).join('; ');
    const prompt = `You are a fantasy football research assistant helping someone prepare for an upcoming draft. Search the web for genuinely new developments (roughly the last 7 days) for these players: ${nameBlock}.

Only flag a player if there is a real, notable update: season-ending injury, new significant injury, trade, release, suspension, retirement, a depth-chart change that shifts their role, a return-from-injury update, or a legal/off-field matter. Do NOT flag routine practice participation, generic camp optimism, or old news.

Classify each flagged player's update with EXACTLY one severity: "season_ending", "significant", "minor", "off_field", or "positive". Use "positive" for good news that raises their value (won a starting job, cleared to play, easier matchup situation). Use "off_field" for legal/suspension matters where fantasy impact is unclear. Use "minor" for day-to-day/questionable designations that likely don't change their role.

Respond with ONLY raw JSON, no markdown fences, no other text. Format exactly: [{"name": "Player Name", "severity": "significant", "note": "one short factual sentence, under 20 words"}]. Omit any player with nothing new to report. If nothing at all is new, respond with [].`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${anthropicResponse.status} ${errText}`);
    }

    const data = await anthropicResponse.json();
    const textBlocks = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    const cleaned = textBlocks.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch updates.' });
  }
}
