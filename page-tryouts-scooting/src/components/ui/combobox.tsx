'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  className?: string;
}

export function Combobox({ value, onChange, options, placeholder = 'Sélectionner ou saisir...', className = '' }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current && isOpen) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : value}
            onChange={handleInputChange}
            onClick={handleInputClick}
            placeholder={placeholder}
            className="input-glass w-full rounded-lg px-3 py-2 pr-10 appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a855f7' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
              minHeight: '2.5rem'
            }}
          />
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="rounded-lg overflow-hidden shadow-2xl"
          style={{ 
            position: 'absolute',
            zIndex: 99999,
            backgroundColor: '#1A112B',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            maxHeight: '15rem',
            overflowY: 'auto',
            top: dropdownPosition.top + 'px',
            left: dropdownPosition.left + 'px',
            width: dropdownPosition.width + 'px'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full text-left transition-colors"
                style={{
                  backgroundColor: value === option ? '#2D1B3D' : '#1A112B',
                  color: value === option ? '#a855f7' : '#f8fafc',
                  padding: '0.75rem 1rem',
                  minHeight: '2.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  fontWeight: value === option ? 600 : 'normal',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (value !== option) {
                    e.currentTarget.style.backgroundColor = '#2D1B3D';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option) {
                    e.currentTarget.style.backgroundColor = '#1A112B';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div 
              style={{
                padding: '0.75rem 1rem',
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}
            >
              No matches found. You can still use "{searchTerm}"
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
