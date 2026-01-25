import { useState } from 'react';
import { TokenSelector } from './TokenSelector';
import { useSwapQuote } from '@/hooks/useSwapQuote';
import { swapperClient } from '@/lib/api/SwapperClient';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowDownUp } from 'lucide-react';
import type { SwapQuote } from '@shared/schema';

export interface TokenMetadata {
  address: string;
  symbol: string;
  decimals?: number;
}

interface SwapInterfaceProps {
  tokens: TokenMetadata[];
  chainId?: number;
}

export function SwapInterface({ tokens, chainId = 137 }: SwapInterfaceProps) {
  const [amount, setAmount] = useState('');
  const [tokenIn, setTokenIn] = useState<TokenMetadata | null>(null);
  const [tokenOut, setTokenOut] = useState<TokenMetadata | null>(null);

  const { data: quote, isLoading, error } = useSwapQuote(
    {
      tokenIn: tokenIn?.address || '',
      tokenOut: tokenOut?.address || '',
      amountIn: amount,
      chainId,
    },
    { enabled: !!tokenIn && !!tokenOut && !!amount }
  );

  const getOutputAmount = (): string | null => {
    if (!quote) return null;
    if (quote.finalAmountOut) {
      return quote.finalAmountOut;
    }
    if (quote.amountOut) {
      return quote.amountOut;
    }
    return null;
  };

  const getRouteInfo = (): string => {
    if (!quote) return '';
    if (quote.distribution && quote.distribution.length > 0) {
      if (quote.distribution.length === 1) {
        const route = quote.distribution[0].route;
        return `Direct route: ${swapperClient.formatRoute(route)}`;
      }
      return `${quote.distribution.length} optimal routes found`;
    }
    if (quote.route) {
      return swapperClient.formatRoute(quote.route);
    }
    return '';
  };

  const formatNumber = (num: string, decimals: number = 4): string => {
    try {
      const n = parseFloat(num);
      return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
    } catch {
      return num;
    }
  };

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  };

  const outputAmount = getOutputAmount();
  const routeInfo = getRouteInfo();
  const priceImpact = tokenOut && outputAmount && amount 
    ? ((parseFloat(outputAmount) / parseFloat(amount)) * 100).toFixed(2) 
    : '0';

  return (
    <Card className="w-full max-w-md mx-auto p-6 shadow-lg border-0 bg-gradient-to-br from-slate-50 to-white">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Swap</h2>
      
      <div className="space-y-4">
        {/* From Token */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">From</label>
            {tokenIn && <span className="text-xs text-gray-500">Balance: --</span>}
          </div>
          <TokenSelector tokens={tokens} selectedToken={tokenIn} onSelectToken={setTokenIn} />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full mt-3 px-0 py-2 text-2xl font-bold border-0 focus:outline-none bg-white"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-2 shadow-lg transition transform hover:scale-110"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-gray-600 uppercase">To</label>
            {tokenOut && <span className="text-xs text-gray-500">Balance: --</span>}
          </div>
          <TokenSelector tokens={tokens} selectedToken={tokenOut} onSelectToken={setTokenOut} />
          {outputAmount ? (
            <div className="w-full mt-3 px-0 py-2 text-2xl font-bold text-gray-800">
              {formatNumber(outputAmount, 6)}
            </div>
          ) : (
            <div className="w-full mt-3 px-0 py-2 text-2xl font-bold text-gray-400">
              0.0
            </div>
          )}
        </div>

        {/* Quote Details */}
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Fetching best route...</p>
          </div>
        )}

        {error && (
          <div className="text-red-600 py-3 px-4 bg-red-50 rounded-lg text-sm">
            Error fetching quote
          </div>
        )}

        {quote === null && tokenIn && tokenOut && amount && !isLoading && (
          <div className="text-yellow-700 py-3 px-4 bg-yellow-50 rounded-lg text-sm">
            No route found between these tokens
          </div>
        )}

        {quote && outputAmount && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg space-y-3 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Exchange Rate:</span>
              <span className="font-bold text-blue-600">{priceImpact}%</span>
            </div>

            {routeInfo && (
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-700">Route:</span>
                <span className="text-sm text-right text-gray-600 max-w-xs">{routeInfo}</span>
              </div>
            )}

            {quote.distribution && quote.distribution.length > 1 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Distribution</p>
                {quote.distribution.map((d, idx) => (
                  <div key={idx} className="text-xs text-gray-600 mb-1 flex justify-between">
                    <span>{d.route.slice(-1)[0].slice(0, 6)}...</span>
                    <span className="font-semibold">{formatNumber(d.amount, 2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={() => console.log('Swap initiated')}
          disabled={!tokenIn || !tokenOut || !amount || !quote || isLoading}
          className="w-full mt-6 h-12 text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500"
        >
          {isLoading ? 'Loading Quote...' : !quote && tokenIn && tokenOut && amount ? 'No Route Found' : 'Swap'}
        </Button>
      </div>
    </Card>
  );
}

