'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Country {
  code: string
  name: string
}

interface SearchableCountrySelectProps {
  value: string
  onChange: (value: string) => void
  countries: Country[]
  placeholder?: string
  className?: string
}

export default function SearchableCountrySelect({
  value,
  onChange,
  countries = [],
  placeholder = 'Select Country',
  className = ''
}: SearchableCountrySelectProps) {
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Defensive check for countries array
  const safeCountries = countries || []
  const selectedCountry = safeCountries.find(c => c.code === value)

  const filteredCountries = safeCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (code: string) => {
    onChange(code)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-dark-card border border-gray-800 rounded-lg text-left text-white hover:border-gray-700 focus:outline-none focus:border-primary transition-all flex items-center justify-between group"
      >
        <span className={selectedCountry ? 'text-white' : 'text-gray-400'}>
          {selectedCountry ? selectedCountry.name : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-dark-card border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchCountries')}
                className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              <>
                {/* Empty option */}
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-800/50 transition-colors ${
                    !value ? 'bg-primary/10 text-primary' : 'text-gray-400'
                  }`}
                >
                  <em>{placeholder}</em>
                </button>
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-800/50 transition-colors flex items-center justify-between ${
                      value === country.code
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-white'
                    }`}
                  >
                    <span>{country.name}</span>
                    {value === country.code && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {t('noCountriesFound')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
