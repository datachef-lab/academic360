import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { socketService } from "@/services/socketService";

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Function to set status based on socket connection
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Register event listeners
    socketService.onConnectionChange(handleConnect, handleDisconnect);

    // Initial connection status check
    setIsConnected(socketService.isConnected());

    // Cleanup on unmount
    return () => socketService.offConnectionChange(handleConnect, handleDisconnect);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"} 
        className="h-6 px-2 flex items-center gap-1 transition-colors"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="text-xs">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">Disconnected</span>
          </>
        )}
      </Badge>
    </div>
  );
} 