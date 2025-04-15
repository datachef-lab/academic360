import { useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Get initial connection status
    setIsConnected(socketService.isConnected());

    // Listen for connection changes
    const handleConnect = () => {
      setIsConnected(true);
      // Get the user's name from the socket service
      setUserName(socketService.getUserName());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setUserName(null);
    };

    // Register listeners
    socketService.onConnectionChange(handleConnect, handleDisconnect);

    // Cleanup
    return () => {
      socketService.offConnectionChange(handleConnect, handleDisconnect);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-2 px-2 py-1 text-xs font-medium transition-colors",
              isConnected
                ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            )}
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            {isConnected ? (
              <span className="flex items-center gap-1">
                Connected
                {userName && (
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    as {userName}
                  </span>
                )}
              </span>
            ) : (
              "Disconnected"
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected 
              ? `Connected to server${userName ? ` as ${userName}` : ''}`
              : "Disconnected from server"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 