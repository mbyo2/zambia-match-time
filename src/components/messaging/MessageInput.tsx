
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image, Camera } from 'lucide-react';
import { validateMessage } from '@/utils/sanitization';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image') => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onTyping, 
  disabled 
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    try {
      // Validate and sanitize message content
      const sanitizedMessage = validateMessage(message);
      onSendMessage(sanitizedMessage, 'text');
      setMessage('');
      
      if (onTyping) {
        onTyping(false);
        setIsTyping(false);
      }
    } catch (error) {
      toast({
        title: "Invalid Message",
        description: error instanceof Error ? error.message : "Message contains invalid content",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (onTyping && !isTyping && e.target.value.length > 0) {
      onTyping(true);
      setIsTyping(true);
    } else if (onTyping && isTyping && e.target.value.length === 0) {
      onTyping(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    try {
      validateImageFile(file);
      // For now, we'll just show a placeholder - image upload would need storage setup
      onSendMessage(`[Image: ${file.name}]`, 'image');
    } catch (error) {
      toast({
        title: "Invalid File",
        description: error instanceof Error ? error.message : "File is not valid",
        variant: "destructive",
      });
    }
  };

  const validateImageFile = (file: File) => {
    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum 10MB allowed.');
    }

    // MIME type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    // File extension validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
      throw new Error('Invalid file extension.');
    }
  };

  return (
    <div className="bg-white border-t p-4">
      <div className="flex gap-2 items-end">
        <div className="flex gap-2">
          <label htmlFor="image-upload">
            <Button variant="ghost" size="sm" asChild>
              <span className="cursor-pointer">
                <Image size={20} />
              </span>
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <Button variant="ghost" size="sm">
            <Camera size={20} />
          </Button>
        </div>
        
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1"
          disabled={disabled}
        />
        
        <Button 
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          className="bg-pink-500 hover:bg-pink-600"
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
