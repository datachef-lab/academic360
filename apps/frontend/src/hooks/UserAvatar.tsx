import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthUser } from "@/types/Auth/authUser";
import { getColorFromName, getInitials } from '@/utils/avatar';

interface UserAvatarProps {
  user?: AuthUser | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base', // ✅ slightly larger for better modern look
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  const bgColor = getColorFromName(user?.name);

  return (

    <Avatar className={`${sizeClasses[size]}  drop-shadow-lg overflow-hidden ${className}`}>
      {user?.avatar ? (
        <AvatarImage 
          src={user.avatar} 
          alt={user.name || 'User avatar'}
          className="object-cover transition-transform duration-200 hover:scale-105" // ✅ smooth hover effect
        />
      ) : (
        <AvatarFallback 
          className={`text-white font-semibold flex items-center justify-center uppercase ${bgColor}`}
        >
          {getInitials(user?.name)}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
