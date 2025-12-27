import React, { useState, useEffect } from 'react';
import { UserState, Task } from '../types';
import { HeartHandshake, Calendar, MessageSquare, Download } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface SupportCircleDashboardProps {
  userState: UserState;
  tasks: Task[];
  supportMessages: string[];
}

interface CareTask {
  id: string;
  title: string;
  date: string;
  assigned: boolean;
  category: 'MEAL' | 'GROCERY' | 'TRANSPORT' | 'OTHER';
}

interface SupportMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const SupportCircleDashboard: React.FC<SupportCircleDashboardProps> = ({
  userState,
  tasks,
  supportMessages
}) => {
  const [careTasks, setCareTasks] = useState<CareTask[]>([
    {
      id: '1',
      title: 'Casseroles for the week',
      date: '2024-01-15',
      assigned: false,
      category: 'MEAL'
    },
    {
      id: '2',
      title: 'Grocery shopping',
      date: '2024-01-16',
      assigned: false,
      category: 'GROCERY'
    },
    {
      id: '3',
      title: 'Ride to memorial service',
      date: '2024-01-20',
      assigned: false,
      category: 'TRANSPORT'
    }
  ]);

  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: '1',
      author: 'Sarah Johnson',
      content: 'Thinking of you and your family during this difficult time.',
      timestamp: '2024-01-14T10:30:00Z'
    },
    {
      id: '2',
      author: 'Michael Chen',
      content: 'I\'m here to help with anything you need - just let me know.',
      timestamp: '2024-01-14T14:15:00Z'
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  const delegatedTasks = tasks.filter(task => task.status === 'DELEGATED');
  const availableTasks = careTasks.filter(task => !task.assigned);

  const handleAssignTask = (taskId: string) => {
    setCareTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, assigned: true } : task
    ));
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      const message: SupportMessage = {
        id: Date.now().toString(),
        author: 'You',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handlePlayEulogy = async () => {
    // This would play the eulogy for the support circle
    console.log('Playing eulogy for support circle...');
  };

  const handleDownloadSummary = () => {
    // Generate and download a summary of care activities
    const summary = {
      deceasedName: userState.deceasedName,
      careTasks: careTasks.filter(t => t.assigned),
      delegatedTasks,
      supportMessages: messages.length,
      lastUpdated: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care-summary-${userState.deceasedName || 'loved-one'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full mb-4">
            <HeartHandshake className="w-5 h-5 text-pink-500" />
            <h1 className="text-xl font-semibold text-gray-800">Support Circle</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Supporting {userState.deceasedName || 'Your Loved One'}
          </h2>
          <p className="text-gray-600">
            Friends and family have come together to help during this time
          </p>
        </div>

        {/* Care Calendar Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Care Calendar</h3>
          </div>

          <div className="grid gap-4">
            {availableTasks.map(task => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {task.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(task.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignTask(task.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    I'll Help
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Tasks Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Logistics Tasks</h3>
          {delegatedTasks.length > 0 ? (
            <div className="space-y-3">
              {delegatedTasks.map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full mt-2 inline-block">
                        Delegated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No logistics tasks have been delegated yet
            </p>
          )}
        </div>

        {/* Messages of Support */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold text-gray-800">Messages of Support</h3>
          </div>

          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {messages.map(message => (
              <div key={message.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {message.author.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-medium text-gray-800">{message.author}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Message */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Leave a message of support..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
            />
            <button
              onClick={handleAddMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4">
            <button
              onClick={handlePlayEulogy}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Listen to Eulogy
            </button>
            <button
              onClick={handleDownloadSummary}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportCircleDashboard;