export const buildPortfolioContextPrompt = (portfolioSummary) => {
  const { cashBalance, totalCurrentValue, totalUnrealizedPnl, totalRealizedPnl, netWorth, holdings } = portfolioSummary;

  const holdingsText = holdings
    .map(
      (h) =>
        `${h.symbol}: quantity ${h.quantity}, avg buy price ${h.avgBuyPrice}, current price ${h.currentPrice}, unrealized P&L ${h.unrealizedPnl.toFixed(2)}`
    )
    .join('\n');

  return `User's current portfolio:
Cash balance: ${cashBalance}
Total holdings value: ${totalCurrentValue}
Net worth: ${netWorth}
Unrealized P&L: ${totalUnrealizedPnl.toFixed(2)}
Realized P&L: ${totalRealizedPnl.toFixed(2)}

Holdings breakdown:
${holdingsText || 'No current holdings'}`;
};

export const buildChatSystemPrompt = () => {
  return `You are a trading assistant for a trading app. You help users understand their portfolio, market movements, and trading concepts. You are not a licensed financial advisor and must not give specific buy/sell recommendations. Always include a brief disclaimer when discussing financial decisions. Keep answers concise and clear.`;
};

export const buildSentimentPrompt = (headlines) => {
  const headlinesText = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

  return `Analyze the overall market sentiment from these news headlines. Respond only in JSON format with no extra text, following this exact shape: { "sentiment": "bullish" | "bearish" | "neutral", "confidence": number between 0 and 1, "summary": "one sentence explanation" }

Headlines:
${headlinesText}`;
};

export const buildDailySummaryPrompt = (marketSnapshot) => {
  const snapshotText = marketSnapshot
    .map((s) => `${s.symbol}: ${s.price} (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`)
    .join('\n');

  return `Write a concise daily market summary (3-4 sentences) for a retail trading app based on this data. Mention the top mover and overall market tone. Do not give investment advice.

Market data:
${snapshotText}`;
};