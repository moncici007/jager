'use client';

import { useState } from 'react';
import axios from 'axios';

interface JagerResponse {
  data: {
    address: string;
    balance: string;
    jager: string;
    jagerBNB: string;
    pendingJager: string;
    pendingJagerBNB: string;
    totalReceivedJager: string;
    totalReceivedJagerBNB: string;
    waitAllocJager: string;
    waitAllocJagerBNB: string;
  };
}

interface AirdropResponse {
  data: {
    address: string;
    claimed: boolean;
    canAirdrop: boolean;
    solanaAddress: string;
    subCount: number;
    reward: string;
    bscBnbBalance: string;
    bscFourMemeTradingVol: string;
    bscMubarakHolders: string;
    bscPancakeTradingVol: string;
    bsTstHolders: string;
    ethPepeHolders: string;
    solPumpfunTradingVol: string;
    solRayTradingVol: string;
    solTrumpBalance: string;
  };
}

interface CombinedResult {
  reward: JagerResponse;
  airdrop: AirdropResponse;
}

const formatNumber = (value: string) => {
  const num = parseFloat(value);
  if (num >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(2) + ' T';
  } else if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + ' B';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + ' M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + ' K';
  }
  return num.toFixed(2);
};

const shortenAddress = (address: string) => {
  return address.slice(0, 6) + '...' + address.slice(-4);
};

// 检查两个数值是否相同（考虑浮点数精度）
const isSameValue = (a: string, b: string) => {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  return Math.abs(numA - numB) < 0.000001;
};

export default function Home() {
  const [addresses, setAddresses] = useState<string>('');
  const [results, setResults] = useState<Map<string, CombinedResult>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [debug, setDebug] = useState<string>('');

  const handleQuery = async () => {
    setLoading(true);
    setError('');
    setDebug('');
    const addressList = addresses.split('\n').filter(addr => addr.trim());
    const newResults = new Map();

    try {
      for (const address of addressList) {
        const cleanAddress = address.trim();
        if (!cleanAddress) continue;

        console.log(`查询地址: ${cleanAddress}`);
        
        // 并行请求两个 API
        const [rewardResponse, airdropResponse] = await Promise.all([
          axios.get(`https://api.jager.meme/api/holder/queryReward/${cleanAddress}`, {
            headers: {
              'accept': 'application/json',
              'accept-language': 'zh-CN,zh;q=0.9',
              'origin': 'https://jager.meme',
              'referer': 'https://jager.meme/',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
            }
          }),
          axios.get(`https://api.jager.meme/api/airdrop/queryAirdrop/${cleanAddress}`, {
            headers: {
              'accept': 'application/json',
              'accept-language': 'zh-CN,zh;q=0.9',
              'origin': 'https://jager.meme',
              'referer': 'https://jager.meme/',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
            }
          })
        ]);

        if (rewardResponse.data.code !== 200 || airdropResponse.data.code !== 200) {
          throw new Error(`查询失败: ${rewardResponse.data.message || airdropResponse.data.message || '未知错误'}`);
        }

        newResults.set(cleanAddress, {
          reward: rewardResponse.data,
          airdrop: airdropResponse.data
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      setResults(newResults);
    } catch (err: any) {
      console.error('查询错误:', err);
      setError(`查询失败: ${err.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      {/* 个人信息展示 */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-12 max-w-md mx-auto text-center border-t-4 border-blue-500">
        <div className="flex flex-col items-center">
          <img 
            src="/XPortrait.jpg" 
            alt="节点科学家" 
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-200 shadow-md hover:border-blue-300 transition-all duration-300 mb-4"
            style={{ width: '96px', height: '96px' }}
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">节点科学家</h1>
          <a 
            href="https://x.com/moncici_is_girl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="text-gray-600">@moncici_is_girl</span>
          </a>
        </div>
      </div>

      {/* Query Section */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12 border-l-4 border-green-500">
          <textarea
            className="w-full h-32 p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="请输入要查询的钱包地址，每行一个"
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors font-medium"
            onClick={handleQuery}
            disabled={loading || !addresses.trim()}
          >
            {loading ? '查询中...' : '批量查询'}
          </button>

          {error && (
            <div className="text-red-500 mt-4 p-4 bg-red-50 rounded-lg">{error}</div>
          )}
          
          {debug && (
            <div className="text-yellow-600 mt-4 p-4 bg-yellow-50 rounded-lg text-sm font-mono whitespace-pre-wrap">{debug}</div>
          )}
        </div>

        {/* Results */}
        {results.size > 0 && (
          <div className="space-y-12">
            {/* 空投信息表格 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-r-4 border-purple-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-purple-900">空投信息</h2>
                <span className="text-sm bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
                  共 {results.size} 个地址
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">钱包地址</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">空投资格</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">领取状态</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">奖励数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.from(results.entries()).map(([address, result]) => (
                      <tr key={address} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">
                          <a 
                            href={`https://jager.meme/?invitor=0x16B9d22B96fC77987820735D8904522655796245`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {shortenAddress(address)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.airdrop.data.canAirdrop
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.airdrop.data.canAirdrop ? '✓ 有资格' : '✕ 无资格'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.airdrop.data.claimed
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.airdrop.data.claimed ? '已领取' : '未领取'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatNumber(result.airdrop.data.reward)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 奖励信息表格 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border-r-4 border-orange-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-orange-900">奖励信息</h2>
                <span className="text-sm bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">
                  共 {results.size} 个地址
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">钱包地址</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Jager</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">JagerBNB</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">待领取 Jager</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">待领取 JagerBNB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.from(results.entries()).map(([address, result]) => (
                      <tr key={address} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">
                          <a 
                            href={`https://jager.meme/?invitor=0x16B9d22B96fC77987820735D8904522655796245`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {shortenAddress(address)}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatNumber(result.reward.data.jager)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatNumber(result.reward.data.jagerBNB)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatNumber(result.reward.data.pendingJager)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatNumber(result.reward.data.pendingJagerBNB)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 