const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const buildPortfolioContextPrompt = (portfolioSummary) => {
  const {
    cashBalance,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalRealizedPnl,
    netWorth,
    holdings,
  } = portfolioSummary;

  const holdingsText = holdings
    .map(
      (h) =>
        `${h.symbol}: quantity ${h.quantity}, avg buy price ${formatINR(h.avgBuyPrice)}, current price ${formatINR(h.currentPriceInr || h.currentPrice || 0)} (${h.currentPriceUsd ? `$${h.currentPriceUsd.toLocaleString()} USD` : ''}), invested value ${formatINR(h.investedValue)}, current value ${formatINR(h.currentValue)}, unrealized P&L ${formatINR(h.unrealizedPnl)} (${h.unrealizedPnlPercent?.toFixed(2)}%)`
    )
    .join('\n');

  return `User's current portfolio (all values in Indian Rupees - INR):
Cash balance: ${formatINR(cashBalance)}
Total holdings value: ${formatINR(totalCurrentValue)}
Net worth: ${formatINR(netWorth)}
Unrealized P&L: ${formatINR(totalUnrealizedPnl)}
Realized P&L: ${formatINR(totalRealizedPnl)}

Holdings breakdown:
${holdingsText || 'No current holdings'}

Note: This user trades crypto assets. Market prices are in USD but all wallet amounts, portfolio values, and P&L figures are in INR (Indian Rupees), converted at live exchange rates.`;
};

export const buildChatSystemPrompt = () => {
  return `You are a trading assistant for an Indian retail trading app called Tradeflow. Users trade cryptocurrency assets. All monetary values in this app are in Indian Rupees (INR, ₹) — wallet balances, portfolio values, P&L figures are all INR. Market prices are quoted in USD but converted to INR at live rates for all calculations. You help users understand their portfolio, market movements, and trading concepts. You are not a licensed financial advisor and must not give specific buy/sell recommendations. When discussing amounts, always use INR/₹ notation. Always include a brief disclaimer when discussing financial decisions. Keep answers concise and clear.`;
};

export const buildSentimentPrompt = (headlines) => {
  const headlinesText = headlines.map((h, i) => `${i + 1}. ${h}`).join('\n');

  return `Analyze the overall market sentiment from these news headlines. Respond only in JSON format with no extra text, following this exact shape: { "sentiment": "bullish" | "bearish" | "neutral", "confidence": number between 0 and 1, "summary": "one sentence explanation" }

Headlines:
${headlinesText}`;
};

export const buildDailySummaryPrompt = (marketSnapshot) => {
  const snapshotText = marketSnapshot
    .map(
      (s) =>
        `${s.symbol}: $${s.price.toLocaleString()} USD (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`
    )
    .join('\n');

  return `Write a concise daily market summary (3-4 sentences) for an Indian retail crypto trading app. Mention the top mover and overall market tone. Note that while prices are in USD, our users invest in INR. Do not give investment advice.

Market data:
${snapshotText}`;
};

export const buildPortfolioInsightsPrompt = (portfolioSummary) => {
  const {
    cashBalance,
    totalCurrentValue,
    totalUnrealizedPnl,
    netWorth,
    holdings,
  } = portfolioSummary;

  const holdingsText = holdings
    .map((h) => `${h.symbol.replace('USDT', '')}: ${h.quantity} units, worth ${formatINR(h.currentValue)} (${h.unrealizedPnlPercent?.toFixed(1)}% P&L)`)
    .join(', ');

  const cashPercent = netWorth > 0 ? ((cashBalance / netWorth) * 100).toFixed(1) : 0;
  const investedPercent = netWorth > 0 ? ((totalCurrentValue / netWorth) * 100).toFixed(1) : 0;

  return `User's portfolio summary (all values in INR):
Net worth: ${formatINR(netWorth)}
Cash: ${formatINR(cashBalance)} (${cashPercent}% of portfolio)
Invested: ${formatINR(totalCurrentValue)} (${investedPercent}% of portfolio)
Unrealized P&L: ${formatINR(totalUnrealizedPnl)}
Holdings: ${holdingsText || 'none'}

Based on this portfolio, give 2-3 short, neutral observations about diversification, concentration risk, or cash allocation. Use INR (₹) for all amounts. Do not recommend specific buy/sell actions. Keep it under 80 words.`;
};