import { createContext, useContext, useState, useCallback } from 'react';
import { Trophy, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      title: notification.title || 'Notification',
      message: notification.message,
      type: notification.type || 'info',
      duration: notification.duration || 5000,
      icon: notification.icon
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const showAchievement = useCallback((achievement) => {
    return addNotification({
      title: '🎉 Achievement Unlocked!',
      message: `${achievement.name} - ${achievement.description} (+${achievement.points_reward || 0} points)`,
      type: 'achievement',
      duration: 7000,
      icon: <Trophy className="h-5 w-5 text-yellow-600" />
    });
  }, [addNotification]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return addNotification({
      title,
      message,
      type: 'success',
      duration: 4000,
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return addNotification({
      title,
      message,
      type: 'error',
      duration: 5000,
      icon: <XCircle className="h-5 w-5 text-red-600" />
    });
  }, [addNotification]);

  const showInfo = useCallback((message, title = 'Info') => {
    return addNotification({
      title,
      message,
      type: 'info',
      duration: 4000,
      icon: <Info className="h-5 w-5 text-blue-600" />
    });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return addNotification({
      title,
      message,
      type: 'warning',
      duration: 5000,
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showAchievement,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  const getTypeClass = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'achievement': return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 text-yellow-900';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-96 max-w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`animate-in slide-in-from-right fade-in duration-300 border rounded-lg shadow-lg p-4 ${getTypeClass(notification.type)}`}
        >
          <div className="flex items-start gap-3">
            {notification.icon && (
              <div className="flex-shrink-0 mt-0.5">
                {notification.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-sm opacity-90">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          
          {/* Progress bar za auto-dismiss */}
          {notification.duration > 0 && (
            <div className="mt-2 h-1 bg-current opacity-20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current opacity-50 transition-all duration-1000 ease-linear"
                style={{ 
                  width: '100%',
                  animation: `shrink ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}