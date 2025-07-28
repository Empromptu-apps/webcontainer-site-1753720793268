import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';

const API_BASE = 'https://builder.empromptu.ai/api_tools';
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer d4c03a1f5c51feec3ce1bfe53f835fe4',
  'X-Generated-App-ID': '95249367-6a82-4918-9a60-482113cbc0d9',
  'X-Usage-Key': '53fb7507b246072e7bd6cc437b147808'
};

const TigerFiveGolfTracker = () => {
  const [activeTab, setActiveTab] = useState('input');
  const [rounds, setRounds] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [showApiLogs, setShowApiLogs] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    course: '',
    totalScore: '',
    doubleBogeyPlus: 0,
    bogeyOnPar5: 0,
    threePutts: 0,
    bogeyInside150: 0,
    missedEasySaves: 0,
    badDrives: 0
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedRounds = localStorage.getItem('tigerFiveRounds');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (savedRounds) {
      setRounds(JSON.parse(savedRounds));
    }
    
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save to localStorage whenever rounds change
  useEffect(() => {
    localStorage.setItem('tigerFiveRounds', JSON.stringify(rounds));
  }, [rounds]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const logApiCall = (method, endpoint, data, response) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      data,
      response,
      id: Date.now()
    };
    setApiLogs(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 logs
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'course' || name === 'date' ? value : parseInt(value) || 0
    }));
  };

  const calculateTigerFive = (round) => {
    return round.doubleBogeyPlus + round.bogeyOnPar5 + round.threePutts + 
           round.bogeyInside150 + round.missedEasySaves;
  };

  const submitRound = async () => {
    if (!formData.course || !formData.totalScore) {
      alert('Please enter course name and total score');
      return;
    }

    const newRound = {
      ...formData,
      id: Date.now(),
      tigerFive: calculateTigerFive(formData)
    };

    const updatedRounds = [...rounds, newRound].sort((a, b) => new Date(b.date) - new Date(a.date));
    setRounds(updatedRounds);

    // Store in API for persistence
    try {
      const apiData = {
        created_object_name: 'golf_rounds',
        data_type: 'strings',
        input_data: [JSON.stringify(newRound)]
      };

      console.log('API Call - POST /input_data:', apiData);
      
      const response = await fetch(`${API_BASE}/input_data`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(apiData)
      });

      const result = await response.json();
      console.log('API Response:', result);
      logApiCall('POST', '/input_data', apiData, result);
      
    } catch (error) {
      console.log('API storage failed, using local storage only:', error);
      logApiCall('POST', '/input_data', apiData, { error: error.message });
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      course: '',
      totalScore: '',
      doubleBogeyPlus: 0,
      bogeyOnPar5: 0,
      threePutts: 0,
      bogeyInside150: 0,
      missedEasySaves: 0,
      badDrives: 0
    });

    alert('Round logged successfully!');
  };

  const deleteApiData = async () => {
    try {
      console.log('API Call - DELETE /objects/golf_rounds');
      
      const response = await fetch(`${API_BASE}/objects/golf_rounds`, {
        method: 'DELETE',
        headers: API_HEADERS
      });

      const result = await response.json();
      console.log('Delete API Response:', result);
      logApiCall('DELETE', '/objects/golf_rounds', null, result);
      
      alert('API data deleted successfully!');
    } catch (error) {
      console.log('API deletion failed:', error);
      logApiCall('DELETE', '/objects/golf_rounds', null, { error: error.message });
    }
  };

  const showRawApiData = async () => {
    try {
      const apiData = {
        object_name: 'golf_rounds',
        return_type: 'raw_text'
      };

      console.log('API Call - POST /return_data:', apiData);
      
      const response = await fetch(`${API_BASE}/return_data`, {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(apiData)
      });

      const result = await response.json();
      console.log('Raw API Data Response:', result);
      logApiCall('POST', '/return_data', apiData, result);
      
      alert(`Raw API Data:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log('Failed to fetch raw API data:', error);
      logApiCall('POST', '/return_data', apiData, { error: error.message });
    }
  };

  const getRecentTrends = (roundCount = 5) => {
    const recent = rounds.slice(0, roundCount);
    if (recent.length < 2) return null;

    const categories = ['doubleBogeyPlus', 'bogeyOnPar5', 'threePutts', 'bogeyInside150', 'missedEasySaves'];
    const trends = {};

    categories.forEach(category => {
      const recentAvg = recent.reduce((sum, round) => sum + round[category], 0) / recent.length;
      const previousAvg = rounds.slice(roundCount, roundCount * 2).reduce((sum, round) => sum + round[category], 0) / Math.min(roundCount, rounds.length - roundCount);
      
      if (previousAvg > 0) {
        trends[category] = ((recentAvg - previousAvg) / previousAvg * 100).toFixed(1);
      }
    });

    return trends;
  };

  const chartData = rounds.slice(0, 20).reverse().map((round, index) => ({
    round: `R${index + 1}`,
    date: round.date,
    tigerFive: round.tigerFive,
    doubleBogeyPlus: round.doubleBogeyPlus,
    bogeyOnPar5: round.bogeyOnPar5,
    threePutts: round.threePutts,
    bogeyInside150: round.bogeyInside150,
    missedEasySaves: round.missedEasySaves,
    badDrives: round.badDrives
  }));

  const mistakeFrequency = rounds.length > 0 ? [
    { name: 'Double Bogey+', count: rounds.reduce((sum, r) => sum + r.doubleBogeyPlus, 0) },
    { name: 'Bogey on Par 5', count: rounds.reduce((sum, r) => sum + r.bogeyOnPar5, 0) },
    { name: '3-Putts', count: rounds.reduce((sum, r) => sum + r.threePutts, 0) },
    { name: 'Bogey <150yds', count: rounds.reduce((sum, r) => sum + r.bogeyInside150, 0) },
    { name: 'Missed Easy Saves', count: rounds.reduce((sum, r) => sum + r.missedEasySaves, 0) },
    { name: 'Bad Drives', count: rounds.reduce((sum, r) => sum + r.badDrives, 0) }
  ] : [];

  const trends = getRecentTrends(5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4 sm:mb-0">
            Tiger Five Golf Tracker
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setShowApiLogs(!showApiLogs)}
              className="btn-secondary text-sm"
            >
              API Logs
            </button>
          </div>
        </div>

        {/* API Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={showRawApiData}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
          >
            Show Raw API Data
          </button>
          <button
            onClick={deleteApiData}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200"
          >
            Delete API Objects
          </button>
        </div>

        {/* API Logs */}
        {showApiLogs && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">API Call Logs</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {apiLogs.map(log => (
                <div key={log.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {log.method} {log.endpoint} - {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                    Request: {JSON.stringify(log.data)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Response: {JSON.stringify(log.response)}
                  </div>
                </div>
              ))}
              {apiLogs.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">No API calls yet</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-8 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'input'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            aria-label="Switch to round input tab"
          >
            Log Round
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            aria-label="Switch to analytics tab"
          >
            Analytics
          </button>
        </div>

        {activeTab === 'input' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Post-Round Entry</h2>
            
            {/* Basic Round Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Round Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-field"
                    aria-label="Round date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Score
                  </label>
                  <input
                    type="number"
                    name="totalScore"
                    value={formData.totalScore}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter total score"
                    aria-label="Total score"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="Enter course name"
                  className="input-field"
                  aria-label="Course name"
                />
              </div>
            </div>

            {/* Tiger Five Mistakes */}
            <div className="card p-6 border-l-4 border-l-yellow-400">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                Tiger Five Mistakes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { name: 'doubleBogeyPlus', label: 'Double Bogey or Worse', description: 'Holes scored 2+ over par' },
                  { name: 'bogeyOnPar5', label: 'Bogey or Worse on Par 5s', description: 'Failed to birdie reachable par 5s' },
                  { name: 'threePutts', label: '3-Putts', description: 'Three or more putts on any green' },
                  { name: 'bogeyInside150', label: 'Bogey from Inside 150 Yards', description: 'Short game mistakes' },
                  { name: 'missedEasySaves', label: 'Missed Easy Up-and-Downs', description: 'Failed saves from close to green' }
                ].map(field => (
                  <div key={field.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      min="0"
                      className="input-field"
                      aria-label={field.label}
                      aria-describedby={`${field.name}-desc`}
                    />
                    <p id={`${field.name}-desc`} className="text-xs text-gray-500 dark:text-gray-400">
                      {field.description}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className={`p-4 rounded-xl ${calculateTigerFive(formData) <= 6 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Tiger Five Total: {calculateTigerFive(formData)}
                  </span>
                  {calculateTigerFive(formData) > 6 && (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Above goal of 6
                    </span>
                  )}
                  {calculateTigerFive(formData) <= 6 && (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ✅ At or below goal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Tracking */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Additional Tracking
              </h3>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bad Drives
                </label>
                <input
                  type="number"
                  name="badDrives"
                  value={formData.badDrives}
                  onChange={handleInputChange}
                  min="0"
                  className="input-field"
                  aria-label="Bad drives"
                  aria-describedby="bad-drives-desc"
                />
                <p id="bad-drives-desc" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Drives that didn't leave an open shot to the green
                </p>
              </div>
            </div>

            <button
              onClick={submitRound}
              className="w-full btn-primary py-4 text-lg font-semibold"
              aria-label="Submit round data"
            >
              Log Round
            </button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Analytics</h2>
            
            {rounds.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">⛳</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No rounds logged yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start tracking your Tiger Five mistakes to see your progress!
                </p>
              </div>
            ) : (
              <>
                {/* Recent Performance Summary */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Recent Performance (Last 5 Rounds)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {(rounds.slice(0, 5).reduce((sum, r) => sum + r.tigerFive, 0) / Math.min(5, rounds.length)).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Average Tiger Five</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className={`text-3xl font-bold mb-2 ${rounds[0]?.tigerFive <= 6 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {rounds[0]?.tigerFive || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last Round</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                        {rounds.filter(r => r.tigerFive <= 6).length}/{rounds.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Rounds ≤ 6 Mistakes</div>
                    </div>
                  </div>
                </div>

                {/* Trend Analysis */}
                {trends && (
                  <div className="card p-6 border-l-4 border-l-green-400">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Recent Trends (Last 5 vs Previous 5)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(trends).map(([category, change]) => {
                        const labels = {
                          doubleBogeyPlus: 'Double Bogey+',
                          bogeyOnPar5: 'Bogey on Par 5',
                          threePutts: '3-Putts',
                          bogeyInside150: 'Bogey <150yds',
                          missedEasySaves: 'Missed Saves'
                        };
                        return (
                          <div key={category} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div className={`text-xl font-bold mb-1 ${change < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {change > 0 ? '+' : ''}{change}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{labels[category]}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tiger Five Trend Chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Tiger Five Trend (Last 20 Rounds)
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="round" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            color: darkMode ? '#f9fafb' : '#111827'
                          }}
                        />
                        <Line type="monotone" dataKey="tigerFive" stroke="#2c5530" strokeWidth={3} name="Tiger Five" />
                        <Line type="monotone" dataKey={6} stroke="#dc2626" strokeDasharray="5 5" name="Goal (6)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Mistake Breakdown Chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Mistake Frequency Breakdown
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mistakeFrequency}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          stroke={darkMode ? '#9ca3af' : '#6b7280'}
                        />
                        <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            color: darkMode ? '#f9fafb' : '#111827'
                          }}
                        />
                        <Bar dataKey="count" fill="#2c5530" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Rounds Table */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Recent Rounds</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Course</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Score</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Tiger 5</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Bad Drives</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rounds.slice(0, 10).map(round => (
                          <tr key={round.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{round.date}</td>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{round.course}</td>
                            <td className="py-3 px-4 text-center text-gray-900 dark:text-gray-100">{round.totalScore}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                round.tigerFive <= 6 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              }`}>
                                {round.tigerFive}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-900 dark:text-gray-100">{round.badDrives}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TigerFiveGolfTracker;
