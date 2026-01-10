'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

export interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value = '',
  onChange,
  onSearch,
  placeholder = '搜索文件名、项目名、客户名、标签...',
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
