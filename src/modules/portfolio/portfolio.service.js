import prisma from '../../config/db.config.js';
import { getMultipleQuotes } from '../market-data/market.service.js';
import { usdToInr, getUsdToInrRate } from '../../utils/currency.js';

export const getUserHoldings = async (userId) => {
  const holdings = await prisma.holding.findMany({
    where: { userId },
  });

  if (holdings.length === 0) {
    return [];
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = await getMultipleQuotes(symbols);
  const rate = await getUsdToInrRate();

  const quoteMap = new Map(quotes.map((q) => [q.symbol, q.price]));

  return holdings.map((holding) => {
    const quantity = Number(holding.quantity);
    const avgBuyPrice = Number(holding.avgBuyPrice);
    const currentPriceUsd = quoteMap.get(holding.symbol) || 0;
    const currentPriceInr = parseFloat((currentPriceUsd * rate).toFixed(2));

    const investedValue = quantity * avgBuyPrice;
    const currentValue = quantity * currentPriceInr;
    const unrealizedPnl = currentValue - investedValue;
    const unrealizedPnlPercent =
      investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0;

    return {
      symbol: holding.symbol,
      quantity,
      avgBuyPrice,
      currentPriceUsd,
      currentPriceInr,
      investedValue,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
    };
  });
};

export const getRealizedPnl = async (userId) => {
  const sellTrades = await prisma.trade.findMany({
    where: {
      side: 'SELL',
      order: { userId },
    },
    include: { order: true },
  });

  let totalRealizedPnl = 0;
  const bySymbol = {};

  for (const trade of sellTrades) {
    const symbol = trade.symbol;
    const sellTotal = Number(trade.total);
    const quantity = Number(trade.quantity);

    const buyTrades = await prisma.trade.findMany({
      where: {
        symbol,
        side: 'BUY',
        order: { userId },
      },
    });

    const totalBuyQty = buyTrades.reduce((sum, t) => sum + Number(t.quantity), 0);
    const totalBuyValue = buyTrades.reduce((sum, t) => sum + Number(t.total), 0);
    const avgBuyPrice = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;

    const costBasis = quantity * avgBuyPrice;
    const tradePnl = sellTotal - costBasis;

    totalRealizedPnl += tradePnl;

    if (!bySymbol[symbol]) {
      bySymbol[symbol] = 0;
    }
    bySymbol[symbol] += tradePnl;
  }

  return { totalRealizedPnl, bySymbol };
};

export const getPortfolioSummary = async (userId) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const holdings = await getUserHoldings(userId);
  const realized = await getRealizedPnl(userId);

  const totalInvested = holdings.reduce((sum, h) => sum + h.investedValue, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);

  const cashBalance = wallet ? Number(wallet.balance) : 0;
  const netWorth = cashBalance + totalCurrentValue;

  return {
    cashBalance,
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalRealizedPnl: realized.totalRealizedPnl,
    netWorth,
    holdings,
  };
};