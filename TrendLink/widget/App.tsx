import React, { useState } from 'react';
import MainWidget from '../prototype/templates/MainWidget';
import AnalyticsDashboard from '../prototype/templates/AnalyticsDashboard';
import WalletConnect from '../prototype/components/WalletConnect';

function App() {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Search Widget
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wallet'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔗 Wallet Connect
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'search' && <MainWidget />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'wallet' && <WalletConnect />}
      </div>
    </div>
  );
}

export default App;
