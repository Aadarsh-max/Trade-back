import axios from 'axios';

let cachedRate = null;
let cacheTime = null;
const CACHE_DURATION_MS = 5 * 60 * 1000;

export const getUsdToInrRate = async () => {
  if (cachedRate && cacheTime && Date.now() - cacheTime < CACHE_DURATION_MS) {
    return cachedRate;
  }

  try {
    const response = await axios.get(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { timeout: 5000 }
    );
    cachedRate = response.data.rates.INR;
    cacheTime = Date.now();
    return cachedRate;
  } catch (err) {
    return cachedRate || 83.5;
  }
};

export const usdToInr = async (usdAmount) => {
  const rate = await getUsdToInrRate();
  return parseFloat((usdAmount * rate).toFixed(2));
};

export const inrToUsd = async (inrAmount) => {
  const rate = await getUsdToInrRate();
  return parseFloat((inrAmount / rate).toFixed(8));
};